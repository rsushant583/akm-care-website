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
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return (
    <section className="section-padding bg-warm-beige">
      <div className="container-premium">
        <h2 className="font-heading text-3xl sm:text-4xl text-center mb-10">
          Guided by Timeless Wisdom
        </h2>

        <div
          className="relative w-full h-[280px] sm:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden card-shadow"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {carouselSlides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <h3 className="font-heading text-2xl sm:text-4xl lg:text-5xl text-card mb-3">
                  {slide.title}
                </h3>
                <p className="text-card/80 text-base sm:text-lg max-w-lg">
                  {slide.subtitle}
                </p>
              </div>
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
