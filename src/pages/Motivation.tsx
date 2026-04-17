import { useMotivation } from "@/hooks/useMotivation";
import { Skeleton } from "@/components/ui/skeleton";
import { Quote } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useEffect, useMemo, useState } from "react";

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

export default function Motivation() {
  const { data: motivationQuotes, loading } = useMotivation();
  const [dayKey, setDayKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const t = window.setTimeout(() => setDayKey(getLocalDateKey()), msUntilNextLocalMidnight());
    return () => window.clearTimeout(t);
  }, [dayKey]);

  const { today, archive } = useMemo(() => {
    const pool = [...motivationQuotes].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    if (pool.length === 0) return { today: null, archive: [] as typeof pool };
    const start = new Date("2026-01-01T00:00:00").getTime();
    const now = new Date(`${dayKey}T00:00:00`).getTime();
    const idx = Math.max(0, Math.floor((now - start) / 86400000)) % pool.length;
    const todayQuote = pool[idx];
    const rest = [...pool.slice(0, idx), ...pool.slice(idx + 1)].reverse();
    return { today: todayQuote, archive: rest };
  }, [motivationQuotes, dayKey]);

  return (
    <>
      <SEO
        title="Daily Motivation — Inspiration for Professionals"
        description="Read AKM Care daily motivational quotes and inspiration archive curated for professionals, teams, and leaders."
        keywords="daily motivation India, inspiration quotes, AKM motivation, workplace motivation"
        canonical="/motivation"
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Daily Motivation</h1>
          <p className="text-lg text-muted-foreground">Start your day with inspiration and purpose</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium max-w-3xl">
          {loading || !today ? (
            <Skeleton className="h-64 rounded-2xl mb-14" />
          ) : (
          <div
            className={`rounded-2xl p-8 sm:p-12 card-shadow text-center mb-14 ${
              today.source === "Phil Jackson"
                ? "bg-gradient-to-br from-primary/10 via-warm-beige to-amber-100/80 ring-2 ring-primary/25"
                : "bg-warm-beige"
            }`}
          >
            <div className="text-sm font-medium text-primary mb-4">Today's Quote</div>
            <Quote size={40} className="text-primary/30 mx-auto mb-4" />
            <blockquote className="font-heading text-2xl sm:text-3xl italic leading-relaxed mb-6">
              "{today.quote}"
            </blockquote>
            <p className="text-muted-foreground font-medium">— {today.source}</p>
          </div>
          )}

          <h2 className="font-heading text-2xl mb-6">Past Inspirations</h2>
          <div className="grid gap-4">
            {archive.map((q) => (
              <div
                key={q.id}
                className={`rounded-2xl p-6 card-shadow ${
                  q.source === "Phil Jackson"
                    ? "bg-gradient-to-br from-primary/5 to-warm-beige ring-1 ring-primary/20"
                    : "bg-card"
                }`}
              >
                <blockquote className="font-heading text-lg italic mb-3">"{q.quote}"</blockquote>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>— {q.source}</span>
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
