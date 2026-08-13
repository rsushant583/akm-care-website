import { Link } from "react-router-dom";
import { SHOP_CATEGORIES } from "@/data/catalog/products";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Compact shop page intro — catalog is the hero, not a corporate banner. */
export function ShopHero() {
  return (
    <section className="bg-[#F5F0EB] border-b border-black/[0.04]">
      <div className="container-premium py-6 sm:py-8 lg:py-10">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-2">
          AKM Care Shop
        </p>
        <p className="type-display max-w-2xl mb-2" style={{ textWrap: "balance" }}>
          Authentic fashion &amp; textile products
        </p>
        <p className="text-sm sm:text-base text-[#6B6B6B] max-w-xl mb-5">
          Browse sarees, lehengas, gowns, suits and jeans — live pricing and stock.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="#shop-catalog" className="btn-primary h-10 px-4 text-sm">
            Browse collection
          </a>
          <Link to="/sell-your-product" className="btn-secondary h-10 px-4 text-sm">
            Sell with AKM Care
          </Link>
        </div>
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
    <div
      className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto scrollbar-hide pb-0.5"
      role="group"
      aria-label="Shop categories"
    >
      {SHOP_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          aria-pressed={active === cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
            active === cat.id
              ? "bg-[#E8621A] text-white shadow-sm shadow-[#E8621A]/25"
              : "bg-white text-[#6B6B6B] ring-1 ring-black/[0.08] hover:ring-[#E8621A]/35",
          )}
        >
          {cat.label === "All" ? "All Products" : cat.label}
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
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="space-y-5">
      <div>
        <h2 className="type-section">{title}</h2>
        {subtitle && <p className="type-meta mt-1.5 text-sm">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
