import { Briefcase, Users, Grid3X3, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { fadeUp, stagger } from "@/lib/animations";

const stats = [
  { value: 500, suffix: "+", label: "Industries Served", icon: Briefcase },
  { value: 10000, suffix: "+", label: "Professionals Trained", icon: Users },
  { value: 15, suffix: "+", label: "Service Verticals", icon: Grid3X3 },
  { value: 0, suffix: "", label: "Pan India Reach", display: "Pan India", icon: MapPin },
];

export default function StatsBar() {
  const rootRef = useRef<HTMLElement>(null);
  const isInView = useInView(rootRef, { once: true, margin: "-80px" });
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    if (!isInView) return;
    const rafIds: number[] = [];
    stats.forEach((s, idx) => {
      if (s.display) return;
      const start = performance.now();
      const duration = 1400;
      const tick = (t: number) => {
        const progress = Math.min((t - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCounts((prev) => {
          const next = [...prev];
          next[idx] = Math.round(s.value * eased);
          return next;
        });
        if (progress < 1) rafIds[idx] = requestAnimationFrame(tick);
      };
      rafIds[idx] = requestAnimationFrame(tick);
    });
    return () => rafIds.forEach((id) => id && cancelAnimationFrame(id));
  }, [isInView]);

  return (
    <section ref={rootRef} className="px-4 sm:px-6 lg:px-8 -mt-10 lg:-mt-14 relative z-20">
      <div className="container-premium">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="rounded-[var(--radius-lg)] bg-white border border-black/5 p-6 shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300"
              >
                <Icon className="text-primary mb-4" size={22} />
                <div className="text-[44px] leading-none text-[#0A0A0A] font-['Cormorant_Garamond']">
                  {stat.display ?? counts[idx].toLocaleString("en-IN")}
                  {!stat.display && <span className="text-base font-['Plus_Jakarta_Sans'] text-primary ml-1">{stat.suffix}</span>}
                </div>
                <p className="text-[13px] text-[#787878] mt-2">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
