import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { carouselSlides } from "@/data/carousel";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";

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

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const parts = root.querySelectorAll("[data-carousel-reveal]");
      gsap.from(parts, {
        opacity: 0,
        y: 44,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      const frame = root.querySelector("[data-carousel-frame]");
      if (frame) {
        gsap.fromTo(
          frame,
          { opacity: 0, scale: 0.97, y: 24 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: root,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-warm-beige to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,720px)] h-[min(90vw,720px)] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

      <div className="container-premium relative z-10">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p data-carousel-reveal className="text-xs font-semibold tracking-[0.25em] uppercase text-primary mb-3">
            Dharma · Work · Purpose
          </p>
          <h2
            data-carousel-reveal
            className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-3 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text"
          >
            Guided by Timeless Wisdom
          </h2>
          <p data-carousel-reveal className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Reflections that shape how we train, serve, and grow with integrity.
          </p>
        </div>

        <div
          data-carousel-frame
          className="relative w-full min-h-[280px] h-[min(72vh,640px)] sm:min-h-[360px] sm:h-[min(75vh,680px)] lg:min-h-[440px] lg:h-[min(78vh,720px)] rounded-[1.75rem] overflow-hidden border border-primary/10 shadow-[0_24px_80px_-24px_rgba(249,115,22,0.25),0_0_0_1px_rgba(0,0,0,0.03)] bg-gradient-to-br from-stone-100/90 via-card to-amber-50/40 backdrop-blur-sm"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {carouselSlides.map((slide, i) => (
            <div
              key={slide.image}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === current ? "opacity-100 z-[1]" : "opacity-0 z-0"
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
                <img
                  src={slide.image}
                  alt={slideAlt(slide)}
                  width={1200}
                  height={720}
                  className="max-h-full max-w-full w-auto h-auto object-contain"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/20 to-transparent z-[2]" />
            </div>
          ))}

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
