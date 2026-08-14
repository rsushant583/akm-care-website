import { Link } from "react-router-dom";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductSkeleton";
import { cn } from "@/lib/utils";

export function ProductRail({
  id,
  title,
  subtitle,
  eyebrow,
  products,
  ctaLabel,
  ctaHref,
  loading = false,
  minItems = 2,
  onQuickView,
  className,
  emptyLabel,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  products: CatalogProduct[];
  ctaLabel?: string;
  ctaHref?: string;
  loading?: boolean;
  minItems?: number;
  onQuickView?: (product: CatalogProduct) => void;
  className?: string;
  emptyLabel?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  const showEmpty = !loading && products.length === 0 && emptyLabel;
  if (!loading && products.length < minItems && !showEmpty) return null;

  return (
    <section id={id} className={cn("space-y-3 sm:space-y-4", className)} aria-labelledby={headingId}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-1">
              {eyebrow}
            </p>
          ) : null}
          <h2 id={headingId} className="type-section text-[1.65rem] sm:text-3xl">
            {title}
          </h2>
          {subtitle ? <p className="type-meta mt-1 text-sm">{subtitle}</p> : null}
        </div>
        {ctaHref && ctaLabel ? (
          <Link to={ctaHref} className="btn-tertiary shrink-0">
            {ctaLabel}
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex lg:grid lg:grid-cols-4 gap-3 overflow-hidden" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[11rem] sm:w-[13rem] lg:w-auto shrink-0">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : showEmpty ? (
        <p className="text-sm text-[#6B6B6B] py-4">{emptyLabel}</p>
      ) : (
        <div
          className="-mx-4 px-4 sm:mx-0 sm:px-0 flex lg:grid lg:grid-cols-4 xl:grid-cols-4 gap-3 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none scrollbar-hide pb-0.5"
          role="list"
          aria-label={title}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              role="listitem"
              className="snap-start shrink-0 w-[11rem] sm:w-[13.25rem] lg:w-auto"
            >
              <ProductCard
                product={product}
                onQuickView={onQuickView}
                compact
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
