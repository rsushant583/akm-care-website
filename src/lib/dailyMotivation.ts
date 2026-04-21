import type { MotivationQuote } from "@/lib/types";

const ANCHOR_MS = new Date("2026-01-01T00:00:00").getTime();
const DAY_MS = 86400000;

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
  const dayStart = new Date(`${dayKey}T00:00:00`).getTime();
  const dayOffset = Math.floor((dayStart - ANCHOR_MS) / DAY_MS);
  const idx =
    Number.isFinite(dayStart) && Number.isFinite(dayOffset)
      ? Math.max(0, dayOffset) % pool.length
      : 0;
  const today = pool[idx];
  const archive = [...pool.slice(0, idx), ...pool.slice(idx + 1)].reverse();
  return { today, archive };
}

export function pickDailyMotivationQuote(quotes: MotivationQuote[], dayKey: string): MotivationQuote | null {
  return getDailyMotivationSlice(quotes, dayKey).today;
}
