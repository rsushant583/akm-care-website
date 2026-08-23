import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import {
  OFFICIAL_BROWSABLE_CATEGORIES,
  getCategoryLabel,
  shopCategoryPath,
  shopCollectionPath,
} from "@/data/catalog/categories";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { getProductDisplayTitle, getProductShortCopy } from "@/lib/ecommerce/productPresentation";
import { getProductImgProps } from "@/lib/images/productImage";
import { trackHeroProductClick, trackHeroView } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const SLIDE_MS = 6500;
const TRANSITION_MS = 500;

const shortLabel: Record<string, string> = {
  "3-piece-suits": "3-Piece Suit",
  "ladies-gown": "Gowns",
  "stitched-lehenga": "Stitched Lehenga",
  "unstitched-lehenga": "Unstitched Lehenga",
  "semi-stitched-gown": "Semi Gown",
  "semi-stitched-lehenga": "Semi Lehenga",
  "semi-stitched-blouse": "Semi Blouse",
  "mens-jeans": "Men's Jeans",
};

function categoryChipLabel(id: string, fallback: string): string {
  return shortLabel[id] || fallback;
}

function SpotlightMedia({
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
    productName: product.name,
    role: "hero",
    priority: Boolean(priority),
  });

  return (
    <img
      {...img}
      // Next slide: lazy + low priority only — never high-priority preload of the full set
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : preload ? "low" : undefined}
      className="absolute inset-0 h-full w-full product-photo"
      alt={img.alt}
    />
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
    return <div className="h-full min-h-[16rem] sm:min-h-[20rem] lg:min-h-[26rem] bg-[#EDE8E2]" aria-hidden />;
  }

  const href = productPath(current.slug);
  const title = getProductDisplayTitle(current);
  const copy = getProductShortCopy(current);
  const price = getEffectivePrice(current);
  const catLabel =
    getCategoryLabel(current.category) || current.categoryLabel || "Collection";
  const catHref = shopCategoryPath(current.category);

  const onProductNav = () => trackHeroProductClick(current, safeIndex);

  return (
    <div
      ref={regionRef}
      className="relative h-full min-h-[16rem] sm:min-h-[20rem] lg:min-h-[26rem] overflow-hidden bg-[#EDE8E2] group/spotlight outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
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

      <div className="absolute inset-0" aria-hidden={false}>
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
              <SpotlightMedia product={product} priority={isCurrent} preload={isNext && !isCurrent} />
            </div>
          );
        })}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/85 via-black/55 to-transparent pt-20 pb-3 px-3 sm:px-4 sm:pb-4"
        aria-live="polite"
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/80 mb-1">
          {catLabel}
        </p>
        <Link
          to={href}
          onClick={onProductNav}
          className="font-heading text-lg sm:text-xl text-white line-clamp-2 hover:underline underline-offset-2"
        >
          {title}
        </Link>
        {copy ? (
          <p className="mt-1 text-xs sm:text-sm text-white/80 line-clamp-2 max-w-md">{copy}</p>
        ) : null}
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          {price > 0 ? (
            <span className="text-sm font-semibold text-white">{formatINR(price)}</span>
          ) : null}
          <Link
            to={href}
            onClick={onProductNav}
            className="inline-flex h-10 items-center px-4 text-xs font-semibold bg-white text-[#1A1A1A] hover:bg-[#F5F0EB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Shop this
          </Link>
          <Link
            to={catHref}
            className="text-xs font-medium text-white/85 hover:text-white underline-offset-2 hover:underline"
          >
            Browse {catLabel}
          </Link>
        </div>
      </div>

      {count > 1 ? (
        <div className="absolute top-3 right-3 z-[2] flex items-center gap-1">
          <button
            type="button"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Previous product"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Next product"
            onClick={() => go(1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          {!reduceMotion ? (
            <button
              type="button"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
            </button>
          ) : null}
        </div>
      ) : null}

      {count > 1 ? (
        <div className="absolute top-3 left-3 z-[2] flex gap-1.5" aria-hidden>
          {products.map((p, i) => (
            <span
              key={p.id}
              className={cn(
                "h-1 rounded-full transition-all",
                i === safeIndex ? "w-4 bg-white/90" : "w-1.5 bg-white/45",
              )}
            />
          ))}
        </div>
      ) : null}

      <span className="sr-only">
        Slide {safeIndex + 1} of {count}: {title}
      </span>
    </div>
  );
}

/**
 * Marketplace-first homepage hero with calm latest-product rotation.
 * H1 / brand copy stays stable for SEO — never product-dependent.
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
    <section className="relative overflow-hidden bg-[#F5F0EB]">
      <div className="container-premium relative z-10 py-4 sm:py-5 lg:py-6">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-stretch">
          <div className="order-1 lg:order-2 min-h-0">
            {spotlight.length > 0 ? (
              <ProductSpotlight products={spotlight} />
            ) : loading ? (
              <div
                className="h-full min-h-[16rem] sm:min-h-[20rem] lg:min-h-[26rem] bg-[#EDE8E2] animate-pulse"
                aria-hidden
              />
            ) : (
              <div className="relative h-full min-h-[12rem] sm:min-h-[14rem] lg:min-h-full overflow-hidden bg-[#EDE8E2]">
                <div className="absolute inset-0 flex items-end p-4 sm:p-5">
                  <p className="text-sm text-[#6B6B6B]">
                    Explore sarees, lehengas and gowns in the shop.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="order-2 lg:order-1 flex flex-col justify-center min-w-0 py-1">
            <p className="text-[0.65rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-2">
              AKM Care Shop
            </p>

            <h1
              className="font-heading text-[1.65rem] sm:text-[2.1rem] lg:text-[2.45rem] leading-[1.12] tracking-tight text-[#1A1A1A] mb-2.5"
              style={{ textWrap: "balance" }}
            >
              Discover something
              <span className="block text-[#E8621A]">you&apos;ll love.</span>
            </h1>

            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-4 max-w-md">
              Sarees, lehengas, gowns, suits and jeans — authentic fashion, delivered pan-India.
            </p>

            <div className="flex flex-wrap gap-2.5 mb-3">
              <Link to="/shop" className="btn-primary h-11 min-w-[8.5rem]">
                Shop now
              </Link>
              <Link to={shopCollectionPath("new-arrivals")} className="btn-secondary h-11">
                New arrivals
              </Link>
            </div>

            <p className="text-[11px] sm:text-xs text-[#6B6B6B] mb-3">
              Pan-India delivery ·{" "}
              <Link to="/shipping-returns" className="underline-offset-2 hover:underline hover:text-[#E8621A]">
                7-day returns
              </Link>{" "}
              · Secure checkout
            </p>

            <div className="flex flex-wrap gap-1.5" aria-label="Browse categories">
              {OFFICIAL_BROWSABLE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  to={shopCategoryPath(cat.id)}
                  className="px-3 py-1.5 min-h-9 text-xs font-semibold bg-white ring-1 ring-black/[0.06] text-[#1A1A1A] hover:ring-[#E8621A]/40 hover:text-[#E8621A] transition-colors"
                >
                  {categoryChipLabel(cat.id, cat.label)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
