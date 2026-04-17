import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";

/** Optional ambient loop — set `VITE_HERO_VIDEO_URL` in `.env` (silent MP4/WebM). */
const HERO_VIDEO =
  typeof import.meta.env.VITE_HERO_VIDEO_URL === "string"
    ? import.meta.env.VITE_HERO_VIDEO_URL.trim()
    : "";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      gsap.set(root.querySelectorAll("[data-hero-line], [data-hero-fade], [data-hero-card]"), {
        clearProps: "all",
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
      const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]");
      const cards = gsap.utils.toArray<HTMLElement>("[data-hero-card]");
      const floats = gsap.utils.toArray<HTMLElement>("[data-hero-float]");

      gsap.set(lines, { opacity: 0, y: 36 });
      gsap.set(fades, { opacity: 0, y: 28 });
      gsap.set(cards, { opacity: 0, y: 64, scale: 0.92 });

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro.to(lines, { opacity: 1, y: 0, duration: 0.95, stagger: 0.11 }, 0.12);
      intro.to(fades, { opacity: 1, y: 0, duration: 0.75, stagger: 0.08 }, 0.28);
      intro.to(
        cards,
        { opacity: 1, y: 0, scale: 1, duration: 0.88, stagger: 0.14, ease: "power3.out" },
        0.42,
      );

      floats.forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -5 : 5,
          duration: 2.6 + i * 0.35,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 1.1 + i * 0.2,
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100dvh] flex items-center overflow-hidden grain-overlay"
    >
      {/* Coffee → beige atmosphere */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[hsl(25_35%_18%)]/25 via-[hsl(35_40%_88%)]/90 to-[hsl(40_45%_94%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_70%_20%,hsl(25_95%_53%/0.12),transparent_55%)]"
        aria-hidden
      />

      {HERO_VIDEO ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.14] pointer-events-none"
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

      <div className="absolute top-24 right-[8%] w-[min(420px,40vw)] h-[min(420px,40vw)] rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 left-[5%] w-[min(320px,35vw)] h-[min(320px,35vw)] rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      <div className="container-premium relative z-10 w-full py-16 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          <div className="max-w-xl">
            <div data-hero-fade className="opacity-0">
              <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-2xl bg-card/65 backdrop-blur-xl border border-primary/10 shadow-lg shadow-primary/5 mb-8">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(25_95%_53%)]" />
                  <span className="text-sm font-semibold text-foreground">Pan-India · Ethics first</span>
                </div>
                <span className="hidden sm:block h-4 w-px bg-border" aria-hidden />
                <span className="text-xs text-muted-foreground font-medium tracking-wide">
                  कर्मण्येवाधिकारस्ते
                </span>
              </div>
            </div>

            <h1
              className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-[3.75rem] leading-[1.05] mb-6 tracking-tight"
              style={{ textWrap: "balance" }}
            >
              <span data-hero-line className="block">
                One Platform
              </span>
              <span data-hero-line className="block">
                For All
              </span>
              <span data-hero-line className="block text-gradient-saffron">
                Solutions.
              </span>
            </h1>

            <p
              data-hero-fade
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-md opacity-0"
            >
              Built with the discipline of duty and the warmth of dharma — solutions that scale with your values.
            </p>

            <div data-hero-fade className="flex flex-col sm:flex-row gap-4 opacity-0">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-105 hover:-translate-y-0.5 transition-all duration-500 ease-in-out"
              >
                Explore Services <ArrowRight size={18} />
              </Link>
              <a
                href="https://www.youtube.com/@akmcare1309"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-border/80 bg-card/50 backdrop-blur-md text-foreground font-semibold text-base hover:bg-card hover:border-primary/25 transition-all duration-300"
              >
                <Play size={18} className="text-primary" /> Watch our story
              </a>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end min-h-[380px] lg:min-h-[460px]">
            <div className="relative w-full max-w-[440px] h-[420px] sm:h-[460px]">
              {/* Layered cards: workforce → training → quote; float wrappers avoid transform conflicts */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center" data-hero-float>
                <div
                  data-hero-card
                  className="w-[88%] rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl p-5 shadow-xl shadow-black/8 ring-1 ring-primary/8 opacity-0"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Workforce</p>
                  <p className="font-heading text-xl text-foreground mb-1">Operational Support</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Reliable, disciplined execution to support teams across operations.
                  </p>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-[88px] sm:bottom-[96px] flex justify-center" data-hero-float>
                <div
                  data-hero-card
                  className="w-[90%] rounded-2xl border border-primary/15 bg-primary/[0.07] backdrop-blur-xl p-5 shadow-lg ring-1 ring-primary/10 opacity-0"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Training</p>
                  <p className="font-heading text-xl text-foreground mb-1">Industrial excellence</p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    Soft skills, technical depth, and compliance — programs that scale with people.
                  </p>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-[184px] sm:bottom-[200px] flex justify-center" data-hero-float>
                <div
                  data-hero-card
                  className="w-[94%] rounded-[1.35rem] border border-white/45 bg-card/55 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl shadow-black/12 ring-1 ring-primary/12 premium-card opacity-0"
                >
                  <p className="font-heading text-xl sm:text-2xl text-foreground/95 leading-snug mb-3">
                    “You have the right to work, not to the fruits of work alone.”
                  </p>
                  <p className="text-sm text-primary font-semibold tracking-wide">— Bhagavad Gita, 2:47</p>
                </div>
              </div>

              <div className="absolute -top-2 right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-500 opacity-85 shadow-lg -z-10 rotate-6 pointer-events-none" />
              <div className="absolute -bottom-4 -left-2 w-28 h-28 rounded-full border-2 border-primary/18 -z-10 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
