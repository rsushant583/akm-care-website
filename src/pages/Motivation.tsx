import { useMotivation } from "@/hooks/useMotivation";
import { Skeleton } from "@/components/ui/skeleton";
import { Quote } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { getDailyMotivationSlice, getLocalDateKey, msUntilNextLocalMidnight } from "@/lib/dailyMotivation";

export default function Motivation() {
  const { data: motivationQuotes, loading } = useMotivation();
  const [dayKey, setDayKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const t = window.setTimeout(() => setDayKey(getLocalDateKey()), msUntilNextLocalMidnight());
    return () => window.clearTimeout(t);
  }, [dayKey]);

  const { today, archive } = useMemo(
    () => getDailyMotivationSlice(motivationQuotes, dayKey),
    [motivationQuotes, dayKey],
  );

  return (
    <>
      <SEO
        title="Daily Motivation — Inspiration for Professionals"
        description="Read AKM Care daily motivational quotes and inspiration archive curated for professionals, teams, and leaders."
        keywords="daily motivation India, inspiration quotes, AKM motivation, workplace motivation"
        canonical="/motivation"
      />
      <section className="section-padding section-shell bg-warm-beige">
        <Reveal className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Daily Motivation</h1>
          <p className="text-lg text-muted-foreground">Start your day with inspiration and purpose</p>
        </Reveal>
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
                : "bg-warm-beige premium-surface"
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
                className={`premium-card rounded-2xl p-6 card-shadow ${
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
