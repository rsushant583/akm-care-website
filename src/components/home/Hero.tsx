import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { shopCollectionPath } from "@/data/catalog/categories";

const HERO_IMG = "/shop/shop-subheading-hero.png";

/**
 * Marketplace-first homepage hero.
 * Search lives in the header (single affordance). Motivation/Gita content is below the fold.
 */
export default function Hero() {
  const reduce = useReducedMotion();

  const focusHeaderSearch = () => {
    const input = document.querySelector<HTMLInputElement>('header input[type="search"]');
    input?.focus();
    input?.scrollIntoView({ block: "nearest" });
  };

  return (
    <section className="relative overflow-hidden bg-[#F5F0EB]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_85%_10%,rgba(232,98,26,0.1),transparent_55%)]"
        aria-hidden
      />

      <div className="container-premium relative z-10 py-7 sm:py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-7 lg:gap-12 items-center">
          <div className="max-w-xl min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-3">
              AKM Care Marketplace
            </p>

            <h1 className="type-display mb-3" style={{ textWrap: "balance" }}>
              Shop authentic fashion
              <span className="block text-[#E8621A]">&amp; village products</span>
            </h1>

            <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed mb-6 max-w-md">
              Sarees, lehengas, gowns, suits and jeans — curated by AKM Care, delivered pan-India.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">
                Shop now <ArrowRight size={16} aria-hidden />
              </Link>
              <Link to={shopCollectionPath("deals")} className="btn-secondary">
                View deals
              </Link>
              <button type="button" onClick={focusHeaderSearch} className="btn-secondary lg:hidden">
                <Search size={16} aria-hidden /> Search
              </button>
            </div>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative hidden sm:block"
          >
            <div className="relative aspect-[4/3] lg:aspect-[4/3] overflow-hidden bg-[#EDE8E2] ring-1 ring-black/[0.06]">
              <img
                src={HERO_IMG}
                alt="AKM Care authentic fashion and textile products"
                width={900}
                height={675}
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/20 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
