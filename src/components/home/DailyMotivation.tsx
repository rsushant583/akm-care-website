import { useMotivation } from "@/hooks/useMotivation";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";
import { runRevealWhenVisible } from "@/lib/runRevealWhenVisible";

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

export default function DailyMotivation() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data: motivationQuotes, loading } = useMotivation();
  const [dayKey, setDayKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const t = window.setTimeout(() => setDayKey(getLocalDateKey()), msUntilNextLocalMidnight());
    return () => window.clearTimeout(t);
  }, [dayKey]);

  const quote = useMemo(() => {
    if (!motivationQuotes || motivationQuotes.length === 0) return null;
    const pool = [...motivationQuotes].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const start = new Date("2026-01-01T00:00:00").getTime();
    const today = new Date(`${dayKey}T00:00:00`).getTime();
    const days = Math.max(0, Math.floor((today - start) / 86400000));
    return pool[days % pool.length];
  }, [motivationQuotes, dayKey]);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root || loading || !quote || prefersReducedMotion()) return;

    let ctx: gsap.Context | null = null;
    const disconnect = runRevealWhenVisible(root, () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.from(root.querySelectorAll("[data-daily-reveal]"), {
          opacity: 0,
          y: 32,
          duration: 0.75,
          stagger: 0.07,
          ease: "power3.out",
        }).fromTo(
          root.querySelector("[data-daily-card]"),
          { opacity: 0, scale: 0.98, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power3.out" },
          "-=0.45",
        );
        tl.play(0);
      }, root);
    });

    return () => {
      disconnect();
      ctx?.revert();
    };
  }, [loading, quote]);

  return (
    <section
      ref={sectionRef}
      className="relative py-12 sm:py-14 lg:py-16 overflow-hidden bg-gradient-to-br from-[#F5A623]/18 via-[#FAF8F5] to-[#E8621A]/12"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] text-[#E8621A] font-heading text-[clamp(6rem,22vw,14rem)] leading-none select-none pl-4 sm:pl-10 -translate-y-4">
        “
      </div>
      <div className="container-premium relative z-10">
        <h2 data-daily-reveal className="font-heading text-3xl sm:text-4xl text-center mb-8 text-[#1A1A1A]">
          Today&apos;s Inspiration
        </h2>

        {loading || !quote ? (
          <Skeleton className="max-w-3xl mx-auto h-56 rounded-2xl" />
        ) : (
          <div
            data-daily-card
            className={`max-w-3xl mx-auto rounded-2xl p-8 sm:p-12 text-center border border-white/50 shadow-[0_20px_60px_rgba(26,26,26,0.08)] ${
              quote.source === "Phil Jackson"
                ? "bg-white/85 backdrop-blur-md ring-1 ring-[#E8621A]/20"
                : "bg-white/80 backdrop-blur-md"
            }`}
          >
            <blockquote className="font-heading text-xl sm:text-2xl lg:text-3xl italic leading-relaxed mb-6 text-[#1A1A1A]">
              &ldquo;{quote.quote}&rdquo;
            </blockquote>
            <p className="text-sm sm:text-base text-[#6B6B6B] font-medium font-body">— {quote.source}</p>
          </div>
        )}
      </div>
    </section>
  );
}
