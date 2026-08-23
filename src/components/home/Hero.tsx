import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { getCategoryLabel, shopCategoryPath, shopCollectionPath } from "@/data/catalog/categories";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { getHeroDisplayTitle } from "@/lib/ecommerce/productPresentation";
import {
  buildLookbookSlides,
  type LookbookSlide,
} from "@/lib/ecommerce/merchandising";
import { getProductImgProps, type ProductImageRole } from "@/lib/images/productImage";
import { trackHeroProductClick, trackHeroView } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const SLIDE_MS = 6500;
const TRANSITION_MS = 550;

function padSlide(n: number): string {
  return String(n).padStart(2, "0");
}

function collectionLabel(product: CatalogProduct): string {
  return getCategoryLabel(product.category) || product.categoryLabel || "New In";
}

function LookbookPlate({
  product,
  role,
  priority,
  preload,
  className,
}: {
  product: CatalogProduct;
  role: ProductImageRole;
  priority?: boolean;
  preload?: boolean;
  className?: string;
}) {
  const src = product.images[0]?.src || product.image_url;
  const img = getProductImgProps({
    src,
    alt: product.images[0]?.alt,
    productName: getHeroDisplayTitle(product),
    role,
    priority: Boolean(priority),
  });

  return (
    <img
      {...img}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : preload ? "low" : undefined}
      className={cn(
        "absolute inset-0 h-full w-full object-cover object-[center_32%] select-none",
        className,
      )}
      alt={img.alt}
      draggable={false}
    />
  );
}

function ProductFrame({
  product,
  role,
  priority,
  preload,
  onNavigate,
  className,
  "aria-label": ariaLabel,
}: {
  product: CatalogProduct;
  role: ProductImageRole;
  priority?: boolean;
  preload?: boolean;
  onNavigate?: () => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Link
      to={productPath(product.slug)}
      onClick={onNavigate}
      aria-label={ariaLabel || getHeroDisplayTitle(product)}
      className={cn(
        "relative block overflow-hidden bg-[#EDE8E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40 focus-visible:ring-offset-2",
        className,
      )}
    >
      <LookbookPlate product={product} role={role} priority={priority} preload={preload} />
    </Link>
  );
}

function LookbookComposition({
  slide,
  slideIndex,
  isActive,
  reduceMotion,
  priorityFirst,
}: {
  slide: LookbookSlide;
  slideIndex: number;
  isActive: boolean;
  reduceMotion: boolean | null;
  priorityFirst?: boolean;
}) {
  const { featured, supporting } = slide;
  const catLabel = collectionLabel(featured);
  const catHref = shopCategoryPath(featured.category);
  const exploreHref = shopCollectionPath("new-arrivals");
  const price = getEffectivePrice(featured);
  const title = getHeroDisplayTitle(featured);
  const showTitle = title.toLowerCase() !== catLabel.toLowerCase();

  const onFeaturedClick = () => trackHeroProductClick(featured, slideIndex);
  const onSupportClick = (product: CatalogProduct, i: number) =>
    trackHeroProductClick(product, slideIndex * 10 + i + 1);

  return (
    <div
      className={cn(
        "flex flex-col w-full",
        // Active slide stays in flow (defines height); inactive overlay for soft crossfade.
        isActive
          ? "relative z-[1] opacity-100"
          : "absolute inset-0 z-0 opacity-0 pointer-events-none",
        !reduceMotion && "motion-safe:transition-opacity",
      )}
      style={!reduceMotion ? { transitionDuration: `${TRANSITION_MS}ms` } : undefined}
      aria-hidden={!isActive}
    >
      {/* Desktop lookbook */}
      <div className="hidden lg:flex lg:flex-col lg:h-full lg:min-h-0">
        <div className="flex flex-1 items-center gap-6 xl:gap-10 min-h-0">
          <ProductFrame
            product={featured}
            role="hero"
            priority={Boolean(priorityFirst && isActive)}
            onNavigate={onFeaturedClick}
            className="aspect-[3/4] w-[min(52%,36rem)] shrink-0"
            aria-label={`Shop ${title}`}
          />

          <Link
            to={exploreHref}
            className="shrink-0 self-center text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-[#1A1A1A]/45 hover:text-[#E8621A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
          >
            Explore
          </Link>

          {supporting.length > 0 ? (
            <div className="flex items-stretch gap-3 xl:gap-4 min-w-0">
              {supporting.map((product, i) => (
                <ProductFrame
                  key={product.id}
                  product={product}
                  role="lookbookSupport"
                  preload={isActive && i === 0}
                  onNavigate={() => onSupportClick(product, i)}
                  className="aspect-[3/4] w-36 xl:w-44 2xl:w-48 shrink-0"
                  aria-label={`Shop ${getHeroDisplayTitle(product)}`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-end justify-between gap-6">
          <div className="min-w-0">
            <Link
              to={catHref}
              className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#1A1A1A] hover:text-[#E8621A] transition-colors"
            >
              {catLabel}
            </Link>
            {showTitle ? (
              <p className="mt-1.5 text-sm text-[#6B6B6B] line-clamp-1 max-w-md">{title}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {price > 0 ? (
                <span className="text-sm font-semibold tabular-nums text-[#1A1A1A]">{formatINR(price)}</span>
              ) : null}
              <Link
                to={productPath(featured.slug)}
                onClick={onFeaturedClick}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E8621A] hover:underline underline-offset-4"
              >
                Shop now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile lookbook — image first, then support strip, then restrained copy */}
      <div className="lg:hidden flex flex-col h-full">
        <ProductFrame
          product={featured}
          role="hero"
          priority={Boolean(priorityFirst && isActive)}
          onNavigate={onFeaturedClick}
          className="aspect-[3/4] w-full"
          aria-label={`Shop ${title}`}
        />

        {supporting.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-2.5">
            {supporting.slice(0, 3).map((product, i) => (
              <ProductFrame
                key={product.id}
                product={product}
                role="lookbookSupport"
                preload={isActive && i === 0}
                onNavigate={() => onSupportClick(product, i)}
                className="aspect-[3/4] w-full"
                aria-label={`Shop ${getHeroDisplayTitle(product)}`}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-4 px-0.5" aria-live={isActive ? "polite" : undefined}>
          <Link
            to={catHref}
            className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#1A1A1A]"
          >
            {catLabel}
          </Link>
          {showTitle ? (
            <p className="mt-1.5 text-[0.95rem] text-[#1A1A1A] line-clamp-2 leading-snug">{title}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {price > 0 ? (
              <span className="text-sm font-semibold tabular-nums text-[#1A1A1A]">{formatINR(price)}</span>
            ) : null}
            <Link
              to={productPath(featured.slug)}
              onClick={onFeaturedClick}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E8621A]"
            >
              Shop now
            </Link>
            <Link
              to={exploreHref}
              className="text-xs font-medium uppercase tracking-[0.18em] text-[#1A1A1A]/40"
            >
              Explore
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LookbookSpotlight({ products }: { products: CatalogProduct[] }) {
  const reduceMotion = useReducedMotion();
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const viewedRef = useRef(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(() => buildLookbookSlides(products, 3), [products]);
  const count = slides.length;
  const safeIndex = count > 0 ? index % count : 0;
  const current = count > 0 ? slides[safeIndex] : null;

  useEffect(() => {
    if (viewedRef.current || products.length === 0) return;
    viewedRef.current = true;
    trackHeroView(products);
  }, [products]);

  const productKey = products.map((p) => p.id).join("|");
  useEffect(() => {
    setIndex(0);
  }, [productKey]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (count <= 1) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (reduceMotion || paused || count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, count]);

  useEffect(() => {
    const el = regionRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [go]);

  if (!current) {
    return <div className="aspect-[3/4] max-w-md bg-[#EDE8E2]" aria-hidden />;
  }

  // Only mount active + adjacent compositions to limit image downloads.
  const visibleIndexes = new Set<number>([safeIndex]);
  if (count > 1) {
    visibleIndexes.add((safeIndex + 1) % count);
  }

  return (
    <div
      ref={regionRef}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40 focus-visible:ring-offset-2"
      role="region"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <p id={labelId} className="sr-only">
        Latest fashion lookbook
      </p>

      <div className="relative">
        {slides.map((slide, i) => {
          if (!visibleIndexes.has(i)) return null;
          return (
            <LookbookComposition
              key={slide.featured.id}
              slide={slide}
              slideIndex={i}
              isActive={i === safeIndex}
              reduceMotion={reduceMotion}
              priorityFirst={i === safeIndex}
            />
          );
        })}
      </div>

      {count > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-[0.7rem] font-medium tracking-[0.2em] tabular-nums text-[#1A1A1A]/40">
            <span className="sr-only">
              Slide {safeIndex + 1} of {count}: {getHeroDisplayTitle(current.featured)}
            </span>
            <span aria-hidden>
              {padSlide(safeIndex + 1)} / {padSlide(count)}
            </span>
          </p>

          <div className="flex items-center gap-1.5" aria-hidden>
            {slides.map((s, i) => (
              <span
                key={s.featured.id}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === safeIndex ? "bg-[#E8621A]" : "bg-[#1A1A1A]/20",
                )}
              />
            ))}
          </div>

          <div className="flex items-center">
            <button
              type="button"
              className="h-11 w-11 inline-flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
              aria-label="Previous look"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              className="h-11 w-11 inline-flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
              aria-label="Next look"
              onClick={() => go(1)}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Editorial lookbook hero — featured product + supporting looks + minimal labels.
 * Inspired by fashion lookbook composition; original AKM Care implementation.
 */
export default function Hero({
  products,
  loading = false,
}: {
  products?: CatalogProduct[];
  loading?: boolean;
}) {
  const spotlight = products && products.length > 0 ? products : [];

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="container-premium relative z-10 py-6 sm:py-8 lg:py-10 xl:py-12">
        <h1 className="sr-only">AKM Care</h1>

        {spotlight.length > 0 ? (
          <LookbookSpotlight products={spotlight} />
        ) : loading ? (
          <div className="space-y-4" aria-hidden>
            <div className="flex gap-6 items-center">
              <div className="aspect-[3/4] w-[min(52%,36rem)] bg-[#EDE8E2] animate-pulse" />
              <div className="hidden lg:flex gap-3 flex-1">
                <div className="aspect-[3/4] w-40 bg-[#EDE8E2] animate-pulse" />
                <div className="aspect-[3/4] w-40 bg-[#EDE8E2] animate-pulse" />
                <div className="aspect-[3/4] w-40 bg-[#EDE8E2] animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#E8621A] mb-3">
              New in
            </p>
            <p className="font-heading text-2xl text-[#1A1A1A]">Shop the collection</p>
            <Link to="/shop" className="btn-primary mt-5 inline-flex h-11">
              Explore
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
