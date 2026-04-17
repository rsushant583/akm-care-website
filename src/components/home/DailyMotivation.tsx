import { Quote } from "lucide-react";
import { useMotivation } from "@/hooks/useMotivation";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsapRegister";
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


  useLayoutEffect(() => {
    const root = sectionRef.current;
    if (!root || loading || !quote || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      tl.from(root.querySelectorAll("[data-daily-reveal]"), {
        opacity: 0,
        y: 40,
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out",
      }).fromTo(
        root.querySelector("[data-daily-card]"),
        { opacity: 0, scale: 0.96, y: 28 },
        { opacity: 1, scale: 1, y: 0, duration: 0.95, ease: "power3.out" },
        "-=0.55",
      );
    }, root);

    return () => ctx.revert();
  }, [loading, quote]);

  return (
    <section ref={sectionRef} className="section-padding">
      <div className="container-premium">
        <h2 data-daily-reveal className="font-heading text-3xl sm:text-4xl text-center mb-10">
          Today's Inspiration
        </h2>

        {loading || !quote ? (
          <Skeleton className="max-w-3xl mx-auto h-56 rounded-2xl" />
        ) : (
        <div
          data-daily-card
          className={`max-w-3xl mx-auto rounded-2xl p-8 sm:p-12 card-shadow text-center ${
            quote.source === "Phil Jackson"
              ? "bg-gradient-to-br from-primary/10 via-warm-beige to-amber-100/80 ring-2 ring-primary/25"
              : "bg-warm-beige"
          }`}
        >
          <Quote size={40} className="text-primary/30 mx-auto mb-4" />
          <blockquote className="font-heading text-xl sm:text-2xl lg:text-3xl italic leading-relaxed mb-6 text-foreground">
            "{quote.quote}"
          </blockquote>
          <p className="text-muted-foreground font-medium">— {quote.source}</p>
        </div>
        )}
      </div>

    </section>
  );
}
