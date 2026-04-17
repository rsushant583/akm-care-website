import { useState, useEffect, useCallback, useRef } from "react";
import { carouselSlides } from "@/data/carousel";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp } from "@/lib/animations";

function slideAlt(slide: (typeof carouselSlides)[number]): string {
  return `${slide.title} — ${slide.subtitle}`;
}

export default function ImageCarousel() {
  const rootRef = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % carouselSlides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5200);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = carouselSlides[current];

  return (
    <section ref={rootRef} className="section-padding relative overflow-hidden">
      <div className="container-premium relative z-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-left mb-10 max-w-2xl">
          <p className="label-kicker text-primary mb-3">
            Dharma · Work · Purpose
          </p>
          <h2 className="text-[var(--size-h2)] mb-3">
            Guided by Timeless Wisdom
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Reflections that shape how we train, serve, and grow with integrity.
          </p>
        </motion.div>

        <div
          className="relative w-full h-[260px] sm:h-[360px] lg:h-[560px] rounded-[var(--radius-xl)] overflow-hidden border border-black/10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.image}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={slide.image}
                alt={slideAlt(slide)}
                width={1200}
                height={720}
                className="w-full h-full object-cover"
                loading={current === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 z-10">
            <div className="inline-flex items-center bg-primary/85 text-white text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full mb-3">
              Featured Insight
            </div>
            <h3 className="text-white text-[clamp(28px,5vw,48px)] leading-[1.1] mb-2 max-w-[680px]">
              {slide.title}
            </h3>
            <p className="text-white/80 text-base max-w-[560px]">{slide.subtitle}</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
            <motion.div key={current} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 4.5, ease: "linear" }} className="h-full bg-primary" />
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-[3]">
            {carouselSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-8 bg-primary shadow-[0_0_12px_rgba(249,115,22,0.5)]" : "w-2 bg-card/80 hover:bg-card"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
