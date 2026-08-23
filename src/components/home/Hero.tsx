import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { getCategoryLabel, shopCategoryPath, shopCollectionPath } from "@/data/catalog/categories";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { getProductCardMeta, getProductDisplayTitle } from "@/lib/ecommerce/productPresentation";
import { getProductImgProps } from "@/lib/images/productImage";
import { trackHeroProductClick, trackHeroView } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const SLIDE_MS = 6500;
const TRANSITION_MS = 550;

function padSlide(n: number): string {
  return String(n).padStart(2, "0");
}

function SpotlightMedia({
  product,
  priority,
  preload,
  className,
}: {
  product: CatalogProduct;
  priority?: boolean;
  preload?: boolean;
  className?: string;
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
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : preload ? "low" : undefined}
      className={cn(
        // Hero-only focal crop — avoids global .product-photo QR bias on cards
        "absolute inset-0 h-full w-full object-cover object-[center_30%]",
        className,
      )}
      alt={img.alt}
    />
  );
}

function ProductCopy({
  product,
  index,
  count,
  onShop,
  tone = "light",
}: {
  product: CatalogProduct;
  index: number;
  count: number;
  onShop: () => void;
  tone?: "light" | "dark";
}) {
  const href = productPath(product.slug);
  const title = getProductDisplayTitle(product);
  const meta = getProductCardMeta(product);
  const price = getEffectivePrice(product);
  const catLabel = getCategoryLabel(product.category) || product.categoryLabel || "Collection";
  const catHref = shopCategoryPath(product.category);
  const eyebrow = product.isNewArrival ? "New arrival" : catLabel;
  const isLight = tone === "light";

  return (
    <div className="min-w-0">
      <p
        className={cn(
          "text-[0.65rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.22em] mb-2",
          isLight ? "text-[#E8621A]" : "text-white/85",
        )}
      >
        <span className={isLight ? "text-[#1A1A1A]/55" : "text-white/55"}>AKM Care</span>
        <span className="mx-2 opacity-40" aria-hidden>
          ·
        </span>
        {eyebrow}
      </p>

      <h2
        className={cn(
          "font-heading text-[1.55rem] sm:text-[1.85rem] lg:text-[2.15rem] leading-[1.15] tracking-tight line-clamp-2",
          isLight ? "text-[#1A1A1A]" : "text-white",
        )}
        style={{ textWrap: "balance" }}
      >
        {title}
      </h2>

      {meta ? (
        <p className={cn("mt-2 text-sm line-clamp-1", isLight ? "text-[#6B6B6B]" : "text-white/80")}>
          {meta}
        </p>
      ) : null}

      {price > 0 ? (
        <p className={cn("mt-3 text-lg font-semibold", isLight ? "text-[#1A1A1A]" : "text-white")}>
          {formatINR(price)}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          to={href}
          onClick={onShop}
          className={cn(
            "inline-flex h-11 min-w-[9rem] items-center justify-center px-5 text-xs font-semibold tracking-wide uppercase transition-colors focus-visible:outline-none focus-visible:ring-2",
            isLight
              ? "bg-[#E8621A] text-white hover:brightness-105 focus-visible:ring-[#E8621A]/40"
              : "bg-white text-[#1A1A1A] hover:bg-[#F5F0EB] focus-visible:ring-white/60",
          )}
        >
          Shop now
        </Link>
        <Link
          to={catHref}
          className={cn(
            "text-xs font-medium underline-offset-4 hover:underline",
            isLight ? "text-[#6B6B6B] hover:text-[#E8621A]" : "text-white/85 hover:text-white",
          )}
        >
          View collection
        </Link>
      </div>

      {count > 1 ? (
        <p
          className={cn(
            "mt-5 text-[0.7rem] font-medium tracking-[0.18em] tabular-nums",
            isLight ? "text-[#1A1A1A]/45" : "text-white/55",
          )}
          aria-hidden
        >
          {padSlide(index + 1)} / {padSlide(count)}
        </p>
      ) : null}
    </div>
  );
}

function NavControls({
  onPrev,
  onNext,
  tone = "dark",
}: {
  onPrev: () => void;
  onNext: () => void;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={cn(
          "h-11 w-11 inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2",
          dark
            ? "text-white/80 hover:text-white focus-visible:ring-white/50"
            : "text-[#1A1A1A]/55 hover:text-[#1A1A1A] focus-visible:ring-[#E8621A]/40",
        )}
        aria-label="Previous product"
        onClick={onPrev}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        className={cn(
          "h-11 w-11 inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2",
          dark
            ? "text-white/80 hover:text-white focus-visible:ring-white/50"
            : "text-[#1A1A1A]/55 hover:text-[#1A1A1A] focus-visible:ring-[#E8621A]/40",
        )}
        aria-label="Next product"
        onClick={onNext}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
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
    return <div className="min-h-[18rem] bg-[#EDE8E2]" aria-hidden />;
  }

  const onProductNav = () => trackHeroProductClick(current, safeIndex);
  const title = getProductDisplayTitle(current);

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

      {/* Mobile: image first, copy below — no overlay squeeze */}
      <div className="lg:hidden">
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#EDE8E2]">
          {products.map((product, i) => {
            const isCurrent = i === safeIndex;
            const isNext = nextProduct?.id === product.id;
            if (!isCurrent && !isNext) return null;
            return (
              <div
                key={`m-${product.id}`}
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

        <div className="bg-[#F5F0EB] px-4 py-5 sm:px-6" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <ProductCopy
                product={current}
                index={safeIndex}
                count={count}
                onShop={onProductNav}
                tone="light"
              />
            </div>
            {count > 1 ? (
              <NavControls onPrev={() => go(-1)} onNext={() => go(1)} tone="light" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Desktop: image-dominant editorial with translucent panel */}
      <div className="hidden lg:block relative overflow-hidden bg-[#EDE8E2] min-h-[32rem] h-[min(70vh,42rem)]">
        {products.map((product, i) => {
          const isCurrent = i === safeIndex;
          const isNext = nextProduct?.id === product.id;
          if (!isCurrent && !isNext) return null;
          return (
            <div
              key={`d-${product.id}`}
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

        {/* Soft left wash so panel text stays readable without opaque card */}
        <div
          className="absolute inset-y-0 left-0 z-[2] w-[min(52%,36rem)] bg-gradient-to-r from-black/55 via-black/25 to-transparent pointer-events-none"
          aria-hidden
        />

        <div className="absolute inset-0 z-[3] flex flex-col justify-end p-8 xl:p-10">
          <div className="flex items-end justify-between gap-6">
            <div
              className="max-w-md rounded-sm bg-black/25 backdrop-blur-[2px] px-5 py-5 xl:px-6 xl:py-6 ring-1 ring-white/10"
              aria-live="polite"
            >
              <ProductCopy
                product={current}
                index={safeIndex}
                count={count}
                onShop={onProductNav}
                tone="dark"
              />
            </div>

            {count > 1 ? (
              <NavControls onPrev={() => go(-1)} onNext={() => go(1)} tone="dark" />
            ) : null}
          </div>
        </div>
      </div>

      <span className="sr-only">
        Slide {safeIndex + 1} of {count}: {title}
      </span>
    </div>
  );
}

/**
 * Image-dominant fashion editorial hero.
 * Stable h1 for SEO; rotating product is h2. Category nav lives outside this component.
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
      <div className="container-premium relative z-10 pt-3 pb-0 sm:pt-4 lg:pt-5 lg:pb-2">
        <h1 className="sr-only">AKM Care</h1>

        {spotlight.length > 0 ? (
          <ProductSpotlight products={spotlight} />
        ) : loading ? (
          <div
            className="min-h-[18rem] lg:min-h-[32rem] lg:h-[min(70vh,42rem)] bg-[#EDE8E2] animate-pulse"
            aria-hidden
          />
        ) : (
          <div className="min-h-[14rem] lg:min-h-[24rem] bg-[#EDE8E2] flex items-end p-6">
            <div>
              <p className="font-heading text-2xl text-[#1A1A1A]">Shop the collection</p>
              <Link to="/shop" className="btn-primary mt-4 inline-flex h-11">
                Shop now
              </Link>
              <Link
                to={shopCollectionPath("new-arrivals")}
                className="ml-3 text-xs font-medium text-[#6B6B6B] underline-offset-4 hover:underline"
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
