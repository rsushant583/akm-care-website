import { useState, useEffect, useCallback } from "react";
import { carouselSlides } from "@/data/fallback";

export default function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % carouselSlides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return (
    <section className="section-padding bg-warm-beige">
      <div className="container-premium">
        <h2 className="font-heading text-3xl sm:text-4xl text-center mb-10">
          Guided by Timeless Wisdom
        </h2>

        <div
          className="relative w-full min-h-[280px] h-[min(72vh,640px)] sm:min-h-[360px] sm:h-[min(75vh,680px)] lg:min-h-[440px] lg:h-[min(78vh,720px)] rounded-2xl overflow-hidden card-shadow bg-gradient-to-br from-stone-200/90 via-warm-beige to-amber-100/70"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {carouselSlides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="max-h-full max-w-full w-auto h-auto object-contain"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
          ))}

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {carouselSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? "bg-card w-6" : "bg-card/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
