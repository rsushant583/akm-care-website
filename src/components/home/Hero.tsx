import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { getCategoryLabel, shopCategoryPath, shopCollectionPath } from "@/data/catalog/categories";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { getHeroDisplayTitle, getHeroFactualMeta } from "@/lib/ecommerce/productPresentation";
import { getProductImgProps } from "@/lib/images/productImage";
import { trackHeroProductClick, trackHeroView } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const SLIDE_MS = 6500;
const TRANSITION_MS = 550;

function padSlide(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Portrait editorial plate — fixed aspect, never stretch.
 * Cover + mid-body focal softens baked-in top QR/logo without distorting proportions.
 */
function EditorialPlate({
  product,
  priority,
  preload,
}: {
  product: CatalogProduct;
  priority?: boolean;
  preload?: boolean;
}) {
  const src = product.images[0]?.src || product.image_url;
  const img = getProductImgProps({
    src,
    alt: product.images[0]?.alt,
    productName: getHeroDisplayTitle(product),
    role: "hero",
    priority: Boolean(priority),
  });

  return (
    <img
      {...img}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : preload ? "low" : undefined}
      className="absolute inset-0 h-full w-full object-cover object-[center_32%] select-none"
      alt={img.alt}
      draggable={false}
    />
  );
}

function ProductCopy({
  product,
  index,
  count,
  onShop,
}: {
  product: CatalogProduct;
  index: number;
  count: number;
  onShop: () => void;
}) {
  const href = productPath(product.slug);
  const title = getHeroDisplayTitle(product);
  const meta = getHeroFactualMeta(product);
  const price = getEffectivePrice(product);
  const catLabel = getCategoryLabel(product.category) || product.categoryLabel || "Collection";
  const catHref = shopCategoryPath(product.category);
  const context = product.isNewArrival ? "New arrival" : catLabel;

  return (
    <div className="min-w-0 max-w-md">
      <p className="text-[0.65rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.22em] mb-3">
        <span className="text-[#1A1A1A]/50">AKM Care</span>
        <span className="mx-2 text-[#1A1A1A]/25" aria-hidden>
          ·
        </span>
        <span className="text-[#E8621A]">{context}</span>
      </p>

      <h2
        className="font-heading text-[1.75rem] sm:text-[2rem] lg:text-[2.15rem] leading-[1.14] tracking-tight text-[#1A1A1A] line-clamp-2"
        style={{ textWrap: "balance" }}
      >
        {title}
      </h2>

      {meta ? <p className="mt-2.5 text-sm text-[#6B6B6B] line-clamp-1">{meta}</p> : null}

      {price > 0 ? (
        <p className="mt-4 text-[1.125rem] font-semibold text-[#1A1A1A] tabular-nums">{formatINR(price)}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link
          to={href}
          onClick={onShop}
          className="inline-flex h-11 min-w-[9.5rem] items-center justify-center px-6 text-xs font-semibold tracking-[0.12em] uppercase bg-[#E8621A] text-white hover:brightness-105 transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
        >
          Shop now
        </Link>
        <Link
          to={catHref}
          className="text-xs font-medium text-[#6B6B6B] underline-offset-4 hover:text-[#E8621A] hover:underline"
        >
          View collection
        </Link>
      </div>

      {count > 1 ? (
        <p className="mt-6 text-[0.7rem] font-medium tracking-[0.2em] tabular-nums text-[#1A1A1A]/40" aria-hidden>
          {padSlide(index + 1)} / {padSlide(count)}
        </p>
      ) : null}
    </div>
  );
}

function NavControls({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className="h-11 w-11 inline-flex items-center justify-center text-[#1A1A1A]/45 hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
        aria-label="Previous product"
        onClick={onPrev}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </button>
      <button
        type="button"
        className="h-11 w-11 inline-flex items-center justify-center text-[#1A1A1A]/45 hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
        aria-label="Next product"
        onClick={onNext}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}

function SlideLayers({
  products,
  safeIndex,
  nextProduct,
  reduceMotion,
  priorityFirst,
}: {
  products: CatalogProduct[];
  safeIndex: number;
  nextProduct: CatalogProduct | null;
  reduceMotion: boolean | null;
  priorityFirst?: boolean;
}) {
  return (
    <>
      {products.map((product, i) => {
        const isCurrent = i === safeIndex;
        const isNext = nextProduct?.id === product.id;
        if (!isCurrent && !isNext) return null;
        return (
          <div
            key={product.id}
            className={cn(
              "absolute inset-0",
              isCurrent ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none",
              !reduceMotion && "motion-safe:transition-opacity",
            )}
            style={!reduceMotion ? { transitionDuration: `${TRANSITION_MS}ms` } : undefined}
            aria-hidden={!isCurrent}
          >
            <EditorialPlate
              product={product}
              priority={Boolean(priorityFirst && isCurrent)}
              preload={isNext && !isCurrent}
            />
          </div>
        );
      })}
    </>
  );
}

function ProductSpotlight({ products }: { products: CatalogProduct[] }) {
  const reduceMotion = useReducedMotion();
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const viewedRef = useRef(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const count = products.length;
  const safeIndex = count > 0 ? index % count : 0;
  const current = count > 0 ? products[safeIndex] : null;
  const nextProduct = count > 1 ? products[(safeIndex + 1) % count] : null;

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

  const onProductNav = () => trackHeroProductClick(current, safeIndex);
  const announceTitle = getHeroDisplayTitle(current);

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
        Latest fashion products
      </p>

      {/*
        Single image plate + copy column.
        Mobile stacks image → copy; desktop uses asymmetric 1.2fr / 0.85fr split.
        One SlideLayers tree avoids duplicate hero downloads.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)] gap-5 sm:gap-6 lg:gap-8 xl:gap-12 lg:items-center">
        <div className="relative w-full max-w-[40rem] justify-self-stretch mx-auto lg:mx-0">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EDE8E2] ring-1 ring-black/[0.05] shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <SlideLayers
              products={products}
              safeIndex={safeIndex}
              nextProduct={nextProduct}
              reduceMotion={reduceMotion}
              priorityFirst
            />
          </div>
        </div>

        <div
          className="flex items-start justify-between gap-3 min-w-0 px-1 sm:px-2 lg:px-0 lg:py-4 lg:flex-col lg:justify-center"
          aria-live="polite"
        >
          <ProductCopy product={current} index={safeIndex} count={count} onShop={onProductNav} />
          {count > 1 ? (
            <div className="shrink-0 lg:mt-2 lg:-ml-2">
              <NavControls onPrev={() => go(-1)} onNext={() => go(1)} />
            </div>
          ) : null}
        </div>
      </div>

      <span className="sr-only">
        Slide {safeIndex + 1} of {count}: {announceTitle}
      </span>
    </div>
  );
}

/**
 * Concept A — premium editorial split hero.
 * Cream typography column + framed portrait plate. No dark overlay / category chips.
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
    <section className="relative overflow-hidden bg-[#FAF8F5]">
      <div className="container-premium relative z-10 py-5 sm:py-6 lg:py-8 xl:py-10">
        <h1 className="sr-only">AKM Care</h1>

        {spotlight.length > 0 ? (
          <ProductSpotlight products={spotlight} />
        ) : loading ? (
          <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)] gap-8 xl:gap-12 items-center">
            <div className="aspect-[3/4] w-full max-w-[40rem] bg-[#EDE8E2] animate-pulse" aria-hidden />
            <div className="hidden lg:block space-y-3" aria-hidden>
              <div className="h-3 w-40 bg-[#EDE8E2] animate-pulse" />
              <div className="h-8 w-72 bg-[#EDE8E2] animate-pulse" />
              <div className="h-4 w-48 bg-[#EDE8E2] animate-pulse" />
              <div className="h-11 w-36 bg-[#EDE8E2] animate-pulse mt-4" />
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)] gap-8 items-center">
            <div className="aspect-[3/4] max-w-[40rem] bg-[#EDE8E2]" aria-hidden />
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#E8621A] mb-3">
                AKM Care
              </p>
              <p className="font-heading text-2xl lg:text-[2.15rem] text-[#1A1A1A]">Shop the collection</p>
              <Link to="/shop" className="btn-primary mt-5 inline-flex h-11">
                Shop now
              </Link>
              <Link
                to={shopCollectionPath("new-arrivals")}
                className="ml-4 text-xs font-medium text-[#6B6B6B] underline-offset-4 hover:underline"
              >
                View collection
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
