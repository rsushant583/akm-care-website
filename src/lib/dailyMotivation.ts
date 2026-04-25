import type { MotivationQuote } from "@/lib/types";

const ANCHOR_DAY_KEY = "2026-01-01";
const DAY_MS = 86400000;
const IST_TIME_ZONE = "Asia/Kolkata";

export function getLocalDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function msUntilNextLocalMidnight(d = new Date()) {
  const next = new Date(d);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - d.getTime();
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day") };
}

export function getIndiaDateKey(date = new Date()) {
  const { y, m, d } = getDatePartsInTimeZone(date, IST_TIME_ZONE);
  return `${y}-${m}-${d}`;
}

export function msUntilNextIndiaMidnight(date = new Date()) {
  const nowInIst = new Date(date.toLocaleString("en-US", { timeZone: IST_TIME_ZONE }));
  const nextInIst = new Date(nowInIst);
  nextInIst.setHours(24, 0, 0, 0);
  return Math.max(1000, nextInIst.getTime() - nowInIst.getTime());
}

function dayKeyToEpochDay(dayKey: string) {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return NaN;
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

function sortedPool(quotes: MotivationQuote[]) {
  return [...quotes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export function getDailyMotivationSlice(quotes: MotivationQuote[], dayKey: string) {
  const pool = sortedPool(quotes);
  if (pool.length === 0) {
    return { today: null as MotivationQuote | null, archive: [] as MotivationQuote[] };
  }
  const dayOffset = dayKeyToEpochDay(dayKey) - dayKeyToEpochDay(ANCHOR_DAY_KEY);
  const idx =
    Number.isFinite(dayOffset)
      ? Math.max(0, dayOffset) % pool.length
      : 0;
  const today = pool[idx];
  const archive = [...pool.slice(0, idx), ...pool.slice(idx + 1)].reverse();
  return { today, archive };
}

export function pickDailyMotivationQuote(quotes: MotivationQuote[], dayKey: string): MotivationQuote | null {
  return getDailyMotivationSlice(quotes, dayKey).today;
}
