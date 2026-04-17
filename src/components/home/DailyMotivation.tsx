import { Quote } from "lucide-react";
import { useMotivation } from "@/hooks/useMotivation";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { fadeUp, stagger } from "@/lib/animations";

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
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
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

  const words = quote?.quote.split(" ") ?? [];

  return (
    <section ref={sectionRef} className="section-padding bg-[#0F0F0F]">
      <div className="container-premium">
        <motion.h2 variants={fadeUp} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-3xl sm:text-4xl text-center mb-10 text-white">
          Today's Inspiration
        </motion.h2>

        {loading || !quote ? (
          <Skeleton className="max-w-3xl mx-auto h-56 rounded-2xl" />
        ) : (
          <div className="max-w-4xl mx-auto text-center py-8 px-4 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.04)_0%,transparent_70%)]">
            <motion.div variants={fadeUp} initial="hidden" animate={isInView ? "visible" : "hidden"} className="text-[160px] leading-[0.5] text-primary/20 mb-10 font-['Cormorant_Garamond']">
              "
            </motion.div>
            <motion.blockquote
              variants={stagger}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="text-[clamp(24px,4vw,42px)] italic leading-[1.5] text-white/90 max-w-[800px] mx-auto mb-8 font-['Cormorant_Garamond']"
            >
              {words.map((word, i) => (
                <motion.span key={`${word}-${i}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} transition={{ duration: 0.2, delay: i * 0.03 }}>
                  {word}{" "}
                </motion.span>
              ))}
            </motion.blockquote>
            <motion.div variants={fadeUp} initial="hidden" animate={isInView ? "visible" : "hidden"} className="flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-primary/40" />
              <p className="text-[13px] uppercase tracking-[0.1em] text-primary font-medium">{quote.source}</p>
              <span className="h-px w-12 bg-primary/40" />
            </motion.div>
            <p className="mt-5 text-[11px] tracking-[0.08em] text-white/35 uppercase">Daily Reflection</p>
          </div>
        )}
      </div>

    </section>
  );
}
