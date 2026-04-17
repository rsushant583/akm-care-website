import { useEffect, useMemo, useState } from "react";
import { gsap } from "@/lib/gsapRegister";
import { thoughts } from "@/data/thoughts";
import { prefersReducedMotion } from "@/lib/motion";

function getLocalDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function msUntilNextLocalMidnight(d = new Date()) {
  const next = new Date(d);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - d.getTime();
}

export default function FloatingQuoteWidget() {
  const [dayKey, setDayKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const timer = window.setTimeout(() => setDayKey(getLocalDateKey()), msUntilNextLocalMidnight());
    return () => window.clearTimeout(timer);
  }, [dayKey]);

  useEffect(() => {
    const node = document.querySelector<HTMLElement>("[data-floating-quote]");
    if (!node) return;
    if (prefersReducedMotion()) return;
    gsap.fromTo(node, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
  }, []);

  const quote = useMemo(() => {
    const start = new Date("2026-01-01T00:00:00").getTime();
    const today = new Date(`${dayKey}T00:00:00`).getTime();
    const dayOffset = Math.max(0, Math.floor((today - start) / 86400000));
    return thoughts[dayOffset % thoughts.length];
  }, [dayKey]);

  return (
    <aside
      data-floating-quote
      className="fixed right-3 sm:right-6 top-[4.8rem] lg:top-[6.2rem] z-40 w-[min(92vw,320px)] pointer-events-none"
      aria-label="Daily quote"
    >
      <div className="rounded-2xl border border-border/70 bg-[hsla(40,55%,95%,0.72)] backdrop-blur-lg shadow-[0_14px_38px_rgba(15,15,15,0.12)] p-4 sm:p-5">
        <p className="text-[0.92rem] leading-relaxed text-foreground/90 line-clamp-4">"{quote.quote}"</p>
        <p className="mt-2 text-xs text-muted-foreground font-medium">— {quote.source}</p>
      </div>
    </aside>
  );
}
