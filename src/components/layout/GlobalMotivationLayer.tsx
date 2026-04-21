import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useMotivation } from "@/hooks/useMotivation";
import {
  getDailyMotivationSlice,
  getLocalDateKey,
  msUntilNextLocalMidnight,
} from "@/lib/dailyMotivation";

const WELCOME_LS = "akm-care-daily-thought-welcome-v1";

function chipDismissKey(dayKey: string) {
  return `akm-care-daily-thought-chip-${dayKey}`;
}

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
    /* private mode / blocked */
  }
}

export default function GlobalMotivationLayer() {
  const { pathname } = useLocation();
  const { data, loading } = useMotivation();
  const [dayKey, setDayKey] = useState(() => getLocalDateKey());
  const [showWelcome, setShowWelcome] = useState(() => !storageGet(WELCOME_LS));
  const [showChip, setShowChip] = useState(() => {
    if (!storageGet(WELCOME_LS)) return false;
    return !storageGet(chipDismissKey(getLocalDateKey()));
  });

  useEffect(() => {
    const t = window.setTimeout(() => setDayKey(getLocalDateKey()), msUntilNextLocalMidnight());
    return () => window.clearTimeout(t);
  }, [dayKey]);

  const quote = useMemo(() => getDailyMotivationSlice(data, dayKey).today, [data, dayKey]);

  useEffect(() => {
    const welcomeSeen = storageGet(WELCOME_LS);
    if (!welcomeSeen) {
      setShowWelcome(true);
      setShowChip(false);
      return;
    }
    setShowWelcome(false);
    setShowChip(!storageGet(chipDismissKey(dayKey)));
  }, [dayKey]);

  useEffect(() => {
    if (!showWelcome) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showWelcome]);

  const dismissWelcome = () => {
    storageSet(WELCOME_LS, "1");
    setShowWelcome(false);
    if (!storageGet(chipDismissKey(dayKey))) {
      setShowChip(true);
    }
  };

  const dismissChip = () => {
    storageSet(chipDismissKey(dayKey), "1");
    setShowChip(false);
  };

  const ready = !loading && quote;

  if (pathname.startsWith("/admin")) return null;
  if (!showWelcome && !showChip) return null;

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
            className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-[3px] transition-opacity hover:bg-[#1A1A1A]/55"
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
              {ready ? (
                <>
                  <blockquote className="font-heading text-center sm:text-left text-xl sm:text-2xl md:text-3xl leading-snug sm:leading-tight italic text-[#1A1A1A]">
                    &ldquo;{quote.quote}&rdquo;
                  </blockquote>
                  <p className="mt-6 text-center sm:text-left text-base font-medium text-[#6B6B6B]">— {quote.source}</p>
                </>
              ) : (
                <div className="w-full space-y-4 animate-pulse" aria-busy="true">
                  <div className="h-4 w-32 rounded-full bg-black/10" />
                  <div className="h-24 rounded-2xl bg-black/[0.06]" />
                  <div className="h-4 w-40 rounded-full bg-black/10" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showChip && !showWelcome ? (
        <aside
          className="fixed left-3 right-3 sm:left-4 sm:right-auto top-[calc(3.5rem+env(safe-area-inset-top,0px)+0.35rem)] lg:top-[calc(4.25rem+env(safe-area-inset-top,0px)+0.35rem)] z-[45] max-w-md sm:max-w-[340px] pointer-events-auto"
          aria-label="Daily motivation"
        >
          <div className="relative rounded-2xl border border-black/[0.08] bg-white/95 backdrop-blur-lg shadow-[0_16px_48px_rgba(15,15,15,0.14)] p-4 sm:p-4 pr-11">
            <button
              type="button"
              onClick={dismissChip}
              className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6B6B6B] hover:bg-black/[0.05] hover:text-[#1A1A1A]"
              aria-label="Dismiss daily thought"
            >
              <X size={18} />
            </button>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#E8621A] mb-1.5">Today&apos;s thought</p>
            {ready ? (
              <>
                <p className="text-[0.9rem] sm:text-[0.92rem] leading-relaxed text-[#1A1A1A]/90 line-clamp-4">&ldquo;{quote.quote}&rdquo;</p>
                <p className="mt-2 text-xs text-[#6B6B6B] font-medium">— {quote.source}</p>
              </>
            ) : (
              <div className="h-16 rounded-lg bg-black/[0.05] animate-pulse" />
            )}
          </div>
        </aside>
      ) : null}
    </>
  );
}
