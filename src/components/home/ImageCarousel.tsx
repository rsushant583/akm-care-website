import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";
import { runRevealWhenVisible } from "@/lib/runRevealWhenVisible";

const WISDOM_VIDEO = "/slides/You_are_extending_202604240022.mp4";

/** Slight zoom past common cinematic / AI letterboxing baked into the file (black bars + corner marks). */
const LETTERBOX_CROP = 1.12;

export default function ImageCarousel() {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion() === true;
  const [frameAspect, setFrameAspect] = useState<string>("16 / 9");
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start 0.85", "end 0.15"],
  });

  const frameY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [28, 0, -20],
  );
  const frameScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduceMotion ? [1, 1, 1] : [0.96, 1, 0.98],
  );
  const frameOpacity = useTransform(scrollYProgress, [0, 0.2], reduceMotion ? [1, 1] : [0.85, 1]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      /* autoplay may be blocked until user gesture; muted usually allows play */
    });
  }, []);

  const onVideoMetadata = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.videoWidth > 0 && v.videoHeight > 0) {
      setFrameAspect(`${v.videoWidth} / ${v.videoHeight}`);
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    let ctx: gsap.Context | null = null;
    const disconnect = runRevealWhenVisible(root, () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const parts = root.querySelectorAll("[data-carousel-reveal]");
        gsap.from(parts, {
          opacity: 0,
          y: 44,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
        });
      }, root);
    });

    return () => {
      disconnect();
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-warm-beige to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,720px)] h-[min(90vw,720px)] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

      <div className="container-premium relative z-10">
        <div className="text-center mb-6 sm:mb-8 max-w-2xl mx-auto">
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

        <motion.div
          data-carousel-frame
          style={{ y: frameY, scale: frameScale, opacity: frameOpacity }}
          className="relative w-full will-change-transform"
        >
          <div
            className="relative w-full overflow-hidden rounded-[1.35rem] border border-primary/10 shadow-[0_24px_80px_-24px_rgba(232,98,26,0.18),0_0_0_1px_rgba(0,0,0,0.06)] bg-black"
            style={{ aspectRatio: frameAspect }}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                transform: `scale(${LETTERBOX_CROP})`,
                transformOrigin: "center center",
              }}
            >
              <video
                ref={videoRef}
                onLoadedMetadata={onVideoMetadata}
                className="absolute inset-0 h-full w-full object-cover object-center select-none"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="AKM Care services and vision — motion graphic"
              >
                <source src={WISDOM_VIDEO} type="video/mp4" />
              </video>
            </div>
            {/* Radial + edge dim: softens light corner watermarks. Fully removing baked-in text requires a clean re-export. */}
            <div
              className="pointer-events-none absolute inset-0 z-[2]"
              style={{
                background:
                  "radial-gradient(ellipse 55% 45% at 100% 100%, rgba(0,0,0,0.48) 0%, transparent 62%)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.1) 0%, transparent 38%)",
              }}
              aria-hidden
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
