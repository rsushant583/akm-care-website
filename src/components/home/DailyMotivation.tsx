import { Quote } from "lucide-react";
import { useMotivation } from "@/hooks/useMotivation";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function DailyMotivation() {
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

  const popupQuote = useMemo(() => {
    return quote;
  }, [quote]);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const k = "akm_inspiration_shown_for";
      const shownFor = localStorage.getItem(k);
      if (shownFor !== dayKey) {
        setOpen(true);
        localStorage.setItem(k, dayKey);
      }
    } catch {
      setOpen(true);
    }
  }, [dayKey]);

  return (
    <section className="section-padding">
      <div className="container-premium">
        <h2 className="font-heading text-3xl sm:text-4xl text-center mb-10">
          Today's Inspiration
        </h2>

        {loading || !quote ? (
          <Skeleton className="max-w-3xl mx-auto h-56 rounded-2xl" />
        ) : (
        <div
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

      {open && !loading && popupQuote && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className={`relative w-full max-w-3xl rounded-2xl p-8 sm:p-12 card-shadow text-center ${
              popupQuote.source === "Phil Jackson"
                ? "bg-gradient-to-br from-primary/10 via-warm-beige to-amber-100/80 ring-2 ring-primary/25"
                : "bg-warm-beige"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/70 border border-border/60 text-foreground font-semibold hover:bg-card transition-all"
            >
              ×
            </button>
            <h3 className="font-heading text-2xl sm:text-3xl mb-6">Today's Inspiration</h3>
            <Quote size={40} className="text-primary/30 mx-auto mb-4" />
            <blockquote className="font-heading text-xl sm:text-2xl lg:text-3xl italic leading-relaxed mb-6 text-foreground">
              "{popupQuote.quote}"
            </blockquote>
            <p className="text-muted-foreground font-medium">— {popupQuote.source}</p>
          </div>
        </div>
      )}
    </section>
  );
}
