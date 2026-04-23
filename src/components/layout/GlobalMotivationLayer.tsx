import { useEffect, useMemo, useState } from "react";
import { Minus, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { dailyQuotes } from "@/data/dailyQuotes";
import { getLocalDateKey, msUntilNextLocalMidnight } from "@/lib/dailyMotivation";

const WELCOME_LS = "akm-care-daily-thought-welcome-v2";
const QUOTE_HIDE_KEY = "akm-care-floating-quote-hide";
const QUOTE_MINIMIZE_KEY = "akm-care-floating-quote-minimized";

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore private mode storage failures */
  }
}

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export default function GlobalMotivationLayer() {
  const { pathname } = useLocation();
  const [dayKey, setDayKey] = useState(() => getLocalDateKey());
  const [showWelcome, setShowWelcome] = useState(() => !storageGet(WELCOME_LS));
  const [hiddenForDay, setHiddenForDay] = useState(() => storageGet(QUOTE_HIDE_KEY) === getLocalDateKey());
  const [minimized, setMinimized] = useState(() => storageGet(QUOTE_MINIMIZE_KEY) === "1");

  useEffect(() => {
    const t = window.setTimeout(() => setDayKey(getLocalDateKey()), msUntilNextLocalMidnight());
    return () => window.clearTimeout(t);
  }, [dayKey]);

  useEffect(() => {
    setHiddenForDay(storageGet(QUOTE_HIDE_KEY) === dayKey);
  }, [dayKey]);

  useEffect(() => {
    if (!showWelcome) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showWelcome]);

  const quote = useMemo(() => {
    const idx = getDayOfYear(new Date(`${dayKey}T00:00:00`)) % dailyQuotes.length;
    return dailyQuotes[idx];
  }, [dayKey]);

  const dismissWelcome = () => {
    storageSet(WELCOME_LS, "1");
    setShowWelcome(false);
  };

  const hideForToday = () => {
    storageSet(QUOTE_HIDE_KEY, dayKey);
    setHiddenForDay(true);
  };

  const toggleMinimize = () => {
    const next = !minimized;
    setMinimized(next);
    storageSet(QUOTE_MINIMIZE_KEY, next ? "1" : "0");
  };

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {showWelcome ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-thought-welcome-title"
        >
          <button
            type="button"
            onClick={dismissWelcome}
            className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-[3px]"
            aria-label="Close thought of the day and return to the site"
          />
          <div className="relative z-10 w-full max-w-[min(100%,36rem)] max-h-[min(88vh,640px)] overflow-y-auto rounded-3xl border border-white/60 bg-[#FAF8F5]/95 shadow-[0_32px_90px_-24px_rgba(26,26,26,0.35)] text-[#1A1A1A] ring-1 ring-black/[0.06]">
            <button
              type="button"
              onClick={dismissWelcome}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#1A1A1A] shadow-sm hover:bg-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="px-6 sm:px-10 py-10 sm:py-12 pr-14 sm:pr-16">
              <p
                id="daily-thought-welcome-title"
                className="text-xs font-semibold tracking-[0.2em] uppercase text-[#E8621A] mb-3 text-center sm:text-left"
              >
                Thought of the day
              </p>
              <p className="text-center sm:text-left text-sm text-[#6B6B6B] mb-6">
                A quick inspiration before you explore the site.
              </p>
              <blockquote className="font-heading text-center sm:text-left text-xl sm:text-2xl md:text-3xl leading-snug sm:leading-tight italic text-[#1A1A1A]">
                &ldquo;{quote.quote}&rdquo;
              </blockquote>
              <p className="mt-6 text-center sm:text-left text-base font-medium text-[#6B6B6B]">— {quote.source}</p>
            </div>
          </div>
        </div>
      ) : null}

      {!showWelcome && !hiddenForDay ? (
        <aside
          className="fixed left-1/2 -translate-x-1/2 top-[calc(3.7rem+env(safe-area-inset-top,0px))] lg:top-[calc(4.25rem+env(safe-area-inset-top,0px))] z-[46] pointer-events-auto"
          aria-label="Daily motivation"
        >
          <div className="rounded-2xl border border-white/40 bg-white/65 backdrop-blur-xl shadow-[0_14px_42px_rgba(15,15,15,0.16)] ring-1 ring-black/[0.06]">
            {minimized ? (
              <button
                type="button"
                onClick={toggleMinimize}
                className="px-3 py-2 text-xs font-semibold text-[#E8621A]"
                aria-label="Expand daily quote"
              >
                Daily quote
              </button>
            ) : (
              <div className="relative w-[min(92vw,30rem)] p-4 pr-12">
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    type="button"
                    onClick={toggleMinimize}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6B6B6B] hover:bg-black/[0.05]"
                    aria-label="Minimize quote"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={hideForToday}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6B6B6B] hover:bg-black/[0.05]"
                    aria-label="Hide quote for today"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#E8621A] mb-1.5">Today&apos;s thought</p>
                <p className="text-[0.9rem] leading-relaxed text-[#1A1A1A]/90 line-clamp-4">&ldquo;{quote.quote}&rdquo;</p>
                <p className="mt-2 text-xs text-[#6B6B6B] font-medium">— {quote.source}</p>
              </div>
            )}
          </div>
        </aside>
      ) : null}
    </>
  );
}
