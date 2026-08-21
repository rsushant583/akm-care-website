import { useEffect, useState } from "react";
import { useDailyQuote } from "@/context/DailyQuoteContext";
import { prefersReducedMotion } from "@/lib/motion";

export default function GlobalMotivationLayer() {
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

  if (!quote) return null;

  const label = "Thought of the day";
  const fullLine = `“${quote.text}” — ${quote.author}`;

  if (reducedMotion) {
    return (
      <section
        className="fixed left-0 right-0 top-0 z-[60] border-b border-[#E8621A]/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85"
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <div className="h-9 px-3 flex items-center justify-center gap-2 text-center overflow-hidden">
          <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-wider text-[#E8621A]">
            {label}
          </span>
          <span className="text-[0.82rem] sm:text-sm text-[#1A1A1A]/90 truncate max-w-[calc(100vw-10rem)]">
            {fullLine}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      className="fixed left-0 right-0 top-0 z-[60] border-b border-[#E8621A]/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85 overflow-hidden"
      role="status"
      aria-live="off"
      aria-label={label}
    >
      <div className="h-9 flex items-center">
        <div className="flex w-max animate-ticker will-change-transform">
          <div className="flex shrink-0 items-center gap-3 px-4 sm:px-5">
            <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-wider text-[#E8621A]">
              {label}
            </span>
            <span className="text-[0.82rem] sm:text-sm text-[#1A1A1A]/90 whitespace-nowrap">
              {fullLine}
            </span>
            <span className="text-[#1A1A1A]/25 select-none" aria-hidden>
              ·
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3 px-4 sm:px-5" aria-hidden="true">
            <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-wider text-[#E8621A]">
              {label}
            </span>
            <span className="text-[0.82rem] sm:text-sm text-[#1A1A1A]/90 whitespace-nowrap">
              {fullLine}
            </span>
            <span className="text-[#1A1A1A]/25 select-none">·</span>
          </div>
        </div>
      </div>
    </section>
  );
}
