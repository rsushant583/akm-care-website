import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { prefersReducedMotion } from "@/lib/motion";
import { useDailyQuote } from "@/context/DailyQuoteContext";

/**
 * Full-width “today’s thought” strip below the nav — continuous right-to-left ticker.
 * Replaces the previous welcome modal and floating closable box.
 */
export default function GlobalMotivationLayer() {
  const { pathname } = useLocation();
  const quote = useDailyQuote();
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" ? prefersReducedMotion() : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (pathname.startsWith("/admin") || !quote) return null;

  const label = "Today's thought";
  const fullLine = `💬 "${quote.text}" — ${quote.author}`;

  if (reducedMotion) {
    return (
      <div
        className="fixed left-0 right-0 z-[40] top-[calc(3.2rem+env(safe-area-inset-top,0px))] lg:top-[calc(3.8rem+env(safe-area-inset-top,0px))] border-b border-[#E8621A]/10 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
        role="status"
        aria-live="polite"
      >
        <div className="container-premium flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-3 py-2.5 sm:py-2 px-3 min-h-9 text-center sm:text-left">
          <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-[#E8621A]">
            {label}
          </span>
          <span className="text-sm text-[#1A1A1A]/90 leading-snug line-clamp-3 sm:line-clamp-2">
            {fullLine}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed left-0 right-0 z-[40] top-[calc(3.2rem+env(safe-area-inset-top,0px))] lg:top-[calc(3.8rem+env(safe-area-inset-top,0px))] border-b border-[#E8621A]/10 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 overflow-hidden"
      role="status"
      aria-live="off"
    >
      <div className="py-2 min-h-9 flex items-center">
        <div className="flex w-max animate-ticker will-change-transform">
          <div className="flex shrink-0 items-center gap-4 pl-4 pr-12">
            <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-[#E8621A]">
              {label}
            </span>
            <span className="text-sm sm:text-[0.9375rem] text-[#1A1A1A]/90 whitespace-nowrap">
              {fullLine}
            </span>
            <span className="text-[#1A1A1A]/25 select-none" aria-hidden>
              ·
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4 pl-4 pr-12" aria-hidden="true">
            <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-[#E8621A]">
              {label}
            </span>
            <span className="text-sm sm:text-[0.9375rem] text-[#1A1A1A]/90 whitespace-nowrap">
              {fullLine}
            </span>
            <span className="text-[#1A1A1A]/25 select-none">·</span>
          </div>
        </div>
      </div>
    </div>
  );
}
