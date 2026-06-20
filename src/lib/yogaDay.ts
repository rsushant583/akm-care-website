import { getIndiaDateKey } from "@/lib/dailyMotivation";

export const YOGA_DAY_KEY = "2026-06-21";
export const YOGA_DAY_MODAL_SESSION_KEY = "akm-yoga-day-modal-closed-2026";

export function isYogaDay(date = new Date()): boolean {
  return getIndiaDateKey(date) === YOGA_DAY_KEY;
}
