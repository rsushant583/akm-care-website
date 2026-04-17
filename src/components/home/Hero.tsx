import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { easeOut } from "@/lib/animations";

/** Optional ambient loop — set `VITE_HERO_VIDEO_URL` in `.env` (silent MP4/WebM). */
const HERO_VIDEO =
  typeof import.meta.env.VITE_HERO_VIDEO_URL === "string"
    ? import.meta.env.VITE_HERO_VIDEO_URL.trim()
    : "";

export default function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -80]);
  const y2 = useTransform(scrollY, [0, 500], [0, -40]);
  const heroWords = useMemo(() => ["One", "Platform.", "Every", "Solution."], []);

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[var(--surface-warm)]">
      <motion.div style={{ y: y1 }} className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.05)_0%,transparent_70%)]" />
      <motion.div style={{ y: y2 }} className="absolute -bottom-[100px] -left-[100px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.04)_0%,transparent_70%)]" />
      <div className="absolute bottom-20 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.06)_30%,rgba(0,0,0,0.06)_70%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.15),transparent_58%)] pointer-events-none" />

      {HERO_VIDEO ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.08] pointer-events-none"
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

      <div className="container-premium relative z-10 py-20 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/70 text-primary label-kicker mb-8">
            <span>Pan-India · Ethics first</span>
          </div>
        </motion.div>

        <h1 className="mx-auto max-w-5xl text-[var(--size-hero)] leading-[var(--leading-hero)] tracking-[var(--tracking-hero)] text-[#0A0A0A]">
          {heroWords.map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block overflow-hidden pr-[0.18em]">
              <motion.span
                className={`inline-block ${word === "Solution." ? "text-gradient-saffron" : ""}`}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + i * 0.12, ease: easeOut }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.95, ease: easeOut }}
          className="text-[18px] text-[#787878] leading-[1.7] max-w-[520px] mx-auto mt-7 mb-12"
        >
          Built with the discipline of duty and the warmth of dharma — solutions that scale with your values.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1, ease: easeOut }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link
            to="/services"
            className="cta-breathe inline-flex items-center justify-center gap-2 px-9 py-[15px] rounded-full bg-primary text-white font-medium text-[15px] shadow-[var(--shadow-saffron)] hover:scale-[1.03] transition-all duration-300"
          >
            Explore Services <ArrowRight size={18} />
          </Link>
          <a
            href="https://www.youtube.com/@akmcare1309"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-9 py-[15px] rounded-full border-[1.5px] border-black/20 text-[#0F0F0F] text-[15px] font-medium hover:border-primary hover:text-primary transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
              <Play size={11} fill="currentColor" className="ml-[1px]" />
            </span>
            Watch our story
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-[#B0B0B0]"
        >
          <span className="label-kicker text-[11px]">Scroll</span>
          <ChevronDown size={16} className="mt-1 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}
