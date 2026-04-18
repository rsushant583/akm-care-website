import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";
import { carouselSlides } from "@/data/carousel";

const HERO_VIDEO =
  typeof import.meta.env.VITE_HERO_VIDEO_URL === "string"
    ? import.meta.env.VITE_HERO_VIDEO_URL.trim()
    : "";

const SLIDE_MS = 3000;

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 120]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = window.setInterval(() => {
      setSlide((s) => (s + 1) % carouselSlides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(t);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      gsap.set(root.querySelectorAll("[data-hero-line], [data-hero-fade]"), {
        clearProps: "all",
        opacity: 1,
        y: 0,
      });
      return;
    }

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
      const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]");
      gsap.set(lines, { opacity: 0, y: 36 });
      gsap.set(fades, { opacity: 0, y: 24 });
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro.to(lines, { opacity: 1, y: 0, duration: 0.85, stagger: 0.1 }, 0.08);
      intro.to(fades, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.22);
      intro.fromTo(
        "[data-hero-carousel]",
        { opacity: 0, x: 48 },
        { opacity: 1, x: 0, duration: 0.85, ease: "power3.out" },
        0.18,
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] flex flex-col justify-center overflow-hidden grain-overlay"
    >
      <motion.div
        ref={parallaxRef}
        style={{ y: parallaxY }}
        className="pointer-events-none absolute inset-0 -z-0 scale-110"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A]/20 via-[#F5F0EB]/95 to-[#FAF8F5]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/65 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_72%_18%,rgba(232,98,26,0.14),transparent_55%)]" />
      </motion.div>

      {HERO_VIDEO ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.1] pointer-events-none -z-0"
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          aria-hidden
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      ) : null}

      <div className="container-premium relative z-10 w-full py-6 sm:py-8 lg:py-6 flex-1 flex flex-col justify-center min-h-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center min-h-0">
          <div className="max-w-xl min-w-0">
            <div data-hero-fade className="opacity-0">
              <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 rounded-full bg-white/80 backdrop-blur-md border border-[#E8621A]/12 shadow-sm mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8621A]" />
                <span className="text-xs font-semibold text-[#1A1A1A] tracking-wide">
                  Pan-India · Ethics first · कर्मण्येवाधिकारस्ते
                </span>
              </div>
            </div>

            <h1
              className="font-heading text-[2.1rem] sm:text-4xl lg:text-[2.65rem] xl:text-[2.85rem] leading-[1.08] mb-4 tracking-tight text-[#1A1A1A]"
              style={{ textWrap: "balance" }}
            >
              <span data-hero-line className="block opacity-0">
                One Platform
              </span>
              <span data-hero-line className="block opacity-0">
                For All
              </span>
              <span data-hero-line className="block opacity-0 text-[#E8621A]">
                Solutions.
              </span>
            </h1>

            <p
              data-hero-fade
              className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed mb-6 max-w-md opacity-0"
            >
              Built with the discipline of duty and the warmth of dharma — solutions that scale with your values.
            </p>

            <div data-hero-fade className="flex flex-col sm:flex-row gap-3 opacity-0">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#E8621A] text-white font-semibold text-sm shadow-lg shadow-[#E8621A]/30 hover:brightness-105 transition-all"
              >
                Explore Services <ArrowRight size={17} />
              </Link>
              <a
                href="https://www.youtube.com/@akmcare1309"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#1A1A1A]/12 bg-white/60 backdrop-blur-md text-[#1A1A1A] font-semibold text-sm hover:border-[#E8621A]/35 transition-all"
              >
                <Play size={17} className="text-[#E8621A]" /> Watch our story
              </a>
            </div>

            <p
              data-hero-fade
              className="mt-5 text-xs sm:text-sm font-medium tracking-wide text-[#6B6B6B] opacity-0"
            >
              500+ Industries · 10,000+ Trained · Pan India
            </p>
          </div>

          <div
            data-hero-carousel
            className="relative min-h-[220px] sm:min-h-[300px] lg:min-h-0 lg:h-[min(58dvh,520px)] w-full opacity-0"
          >
            <div className="relative h-full min-h-[inherit] rounded-2xl overflow-hidden border border-black/8 shadow-[0_24px_80px_-20px_rgba(26,26,26,0.25)] bg-[#F5F0EB]">
              {carouselSlides.map((s, i) => (
                <div
                  key={s.image}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    i === slide ? "opacity-100 z-[1]" : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={s.image}
                    alt={`${s.title} — ${s.subtitle}`}
                    width={1200}
                    height={720}
                    className="w-full h-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={i === 0 ? "high" : undefined}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
                </div>
              ))}

              <div className="absolute top-4 right-4 z-[3] rounded-full bg-white/92 backdrop-blur-md px-3 py-1.5 text-[0.65rem] sm:text-xs font-semibold text-[#1A1A1A] border border-white/60 shadow-sm">
                Est. 2018 | Trusted by 500+ Companies
              </div>

              <div className="absolute left-4 bottom-4 right-4 sm:right-auto sm:max-w-[min(100%,340px)] z-[3] rounded-xl bg-black/45 backdrop-blur-md border border-white/15 p-4 text-white shadow-lg">
                <p className="font-heading text-sm sm:text-base italic leading-snug text-white/95">
                  “You have the right to work, not to the fruits of work alone.”
                </p>
                <p className="mt-2 text-xs font-semibold text-[#F5A623] tracking-wide">— Bhagavad Gita, 2:47</p>
              </div>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-[4]">
              {carouselSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === slide ? "w-7 bg-[#E8621A]" : "w-1.5 bg-white/70 hover:bg-white"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
