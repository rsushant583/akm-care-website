import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SHOP_CATEGORIES } from "@/data/catalog/products";

const HERO_IMG = "/shop/shop-subheading-hero.png";

export function ShopHero() {
  const reduce = useReducedMotion();

  return (
    <section className="section-padding pt-6 sm:pt-8 lg:pt-10 bg-[#F5F0EB]">
      <div className="container-premium grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8621A] mb-3">
            AKM Care Shop
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[2.75rem] text-[#1A1A1A] leading-tight mb-4">
            Authentic Village Products
          </h1>
          <p className="text-lg text-[#6B6B6B] mb-6 max-w-xl">
            We sell online, Authentic Various Domestic Food Items, Fancy Sarees & Textile Products.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#shop-catalog"
              className="inline-flex px-5 py-2.5 rounded-full bg-[#E8621A] text-white text-sm font-semibold shadow-md shadow-[#E8621A]/20"
            >
              Shop Collection
            </a>
            <Link
              to="/sell-your-product"
              className="inline-flex px-5 py-2.5 rounded-full border border-black/10 bg-white text-sm font-semibold text-[#1A1A1A]"
            >
              Sell with AKM Care
            </Link>
          </div>
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <img
            src={HERO_IMG}
            alt=""
            width={900}
            height={560}
            loading="eager"
            decoding="async"
            className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-2xl border border-black/[0.06] shadow-lg"
            aria-hidden
          />
        </motion.div>
      </div>
    </section>
  );
}

export function CategoryStrip({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SHOP_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            active === cat.id
              ? "bg-[#E8621A] text-white shadow-md"
              : "bg-[#FAF8F5] border border-black/[0.08] text-[#6B6B6B] hover:border-[#E8621A]/30"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export function ProductSection({
  title,
  subtitle,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl sm:text-3xl text-[#1A1A1A]">{title}</h2>
        {subtitle && <p className="text-sm text-[#6B6B6B] mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
