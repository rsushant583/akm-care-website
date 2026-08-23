import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import {
  OFFICIAL_BROWSABLE_CATEGORIES,
  shopCategoryPath,
  shopCollectionPath,
  type OfficialCategoryId,
} from "@/data/catalog/categories";
import { productPath } from "@/lib/ecommerce/slug";
import { getProductImgProps } from "@/lib/images/productImage";
import type { HeroCategoryCollage } from "@/lib/ecommerce/merchandising";
import { cn } from "@/lib/utils";

export type HeroTile = {
  src: string;
  alt: string;
  href?: string;
};

/** Real catalog paths for first paint — replaced by live tiles when catalog loads. */
const SEED_TILES: HeroTile[] = [
  { src: "/catalog/akmc-sani-1007/01.png", alt: "AKMC SANI saree", href: productPath("akmc-sani-1007") },
  { src: "/catalog/akmc-rooh-0002/01.png", alt: "AKMC ROOH saree", href: productPath("akmc-rooh-0002") },
];

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

const HOLD_MS = 2000;
const FADE_MS = 550;

function HeroMosaic({
  tiles,
  priority,
  preload,
}: {
  tiles: HeroTile[];
  priority?: boolean;
  preload?: boolean;
}) {
  const shown = tiles.slice(0, 3);
  if (shown.length === 0) {
    return <div className="h-full min-h-[12rem] bg-[#EDE8E2]" aria-hidden />;
  }

  const Tile = ({
    tile,
    className,
    eager,
    low,
  }: {
    tile: HeroTile;
    className?: string;
    eager?: boolean;
    low?: boolean;
  }) => {
    const imgProps = getProductImgProps({
      src: tile.src,
      alt: tile.alt,
      productName: tile.alt,
      role: "hero",
      priority: Boolean(eager),
    });
    const img = (
      <img
        {...imgProps}
        className="absolute inset-0 h-full w-full product-photo select-none"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : low ? "low" : undefined}
        alt={imgProps.alt}
        draggable={false}
      />
    );
    const body = (
      <div className={cn("relative overflow-hidden bg-[#EDE8E2]", className)}>
        {img}
      </div>
    );
    if (!tile.href) return body;
    return (
      <Link
        to={tile.href}
        className={cn("relative overflow-hidden bg-[#EDE8E2] block", className)}
        aria-label={tile.alt}
      >
        {img}
      </Link>
    );
  };

  const Neutral = ({ className }: { className?: string }) => (
    <div className={cn("relative overflow-hidden bg-[#E8DFD6]", className)} aria-hidden />
  );

  // Always keep the approved 2×2 mosaic proportions; fill missing cells neutrally.
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 sm:gap-2 h-full min-h-[13.5rem] sm:min-h-[16rem] lg:min-h-[22rem]">
      <Tile tile={shown[0]} className="row-span-2" eager={priority} />
      {shown[1] ? (
        <Tile tile={shown[1]} eager={false} low={preload} />
      ) : (
        <Neutral />
      )}
      {shown[2] ? (
        <Tile tile={shown[2]} eager={false} low={preload} />
      ) : (
        <Neutral />
      )}
    </div>
  );
}

function RotatingCategoryMosaic({
  collages,
  activeIndex,
  reduceMotion,
}: {
  collages: HeroCategoryCollage[];
  activeIndex: number;
  reduceMotion: boolean | null;
}) {
  const count = collages.length;
  const safeIndex = count > 0 ? activeIndex % count : 0;
  const nextIndex = count > 1 ? (safeIndex + 1) % count : safeIndex;

  const visible = useMemo(() => {
    const set = new Set<number>([safeIndex]);
    if (count > 1 && !reduceMotion) set.add(nextIndex);
    return set;
  }, [safeIndex, nextIndex, count, reduceMotion]);

  return (
    <div className="relative h-full min-h-[13.5rem] sm:min-h-[16rem] lg:min-h-[22rem]">
      {[...visible].map((i) => {
        const isActive = i === safeIndex;
        return (
          <div
            key={collages[i].categoryId}
            className={cn(
              "inset-0",
              isActive ? "relative z-[1] opacity-100" : "absolute inset-0 z-0 opacity-0 pointer-events-none",
              !reduceMotion && "motion-safe:transition-opacity",
            )}
            style={!reduceMotion ? { transitionDuration: `${FADE_MS}ms` } : undefined}
            aria-hidden={!isActive}
          >
            <HeroMosaic
              tiles={collages[i].tiles}
              priority={isActive}
              preload={!isActive}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Marketplace-first homepage hero.
 * Layout preserved; right-side mosaic rotates by official category when collages are available.
 */
export default function Hero({
  tiles,
  collages = [],
}: {
  tiles?: HeroTile[];
  collages?: HeroCategoryCollage[];
}) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const mosaicRef = useRef<HTMLDivElement>(null);

  const rotatable = collages.length > 0;
  const count = collages.length;
  const safeIndex = count > 0 ? index % count : 0;
  const activeCategoryId: OfficialCategoryId | null = rotatable
    ? collages[safeIndex].categoryId
    : null;

  const collageKey = collages.map((c) => c.categoryId).join("|");
  useEffect(() => {
    setIndex(0);
  }, [collageKey]);

  const selectCategory = useCallback(
    (categoryId: OfficialCategoryId) => {
      const next = collages.findIndex((c) => c.categoryId === categoryId);
      if (next >= 0) setIndex(next);
    },
    [collages],
  );

  useEffect(() => {
    if (reduceMotion || paused || count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, count, index]);

  const fallbackTiles = tiles && tiles.length > 0 ? tiles : SEED_TILES;

  return (
    <section className="relative overflow-hidden bg-[#F5F0EB]">
      <div className="container-premium relative z-10 py-4 sm:py-5 lg:py-6">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-stretch">
          <div
            ref={mosaicRef}
            className="order-1 lg:order-2 min-h-0"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setPaused(false);
              }
            }}
          >
            {rotatable ? (
              <RotatingCategoryMosaic
                collages={collages}
                activeIndex={safeIndex}
                reduceMotion={reduceMotion}
              />
            ) : (
              <HeroMosaic tiles={fallbackTiles} priority />
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
              <Link to={shopCollectionPath("deals")} className="btn-secondary h-11">
                View deals
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
              {OFFICIAL_BROWSABLE_CATEGORIES.map((cat) => {
                const isActive = activeCategoryId === cat.id;
                return (
                  <Link
                    key={cat.id}
                    to={shopCategoryPath(cat.id)}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => selectCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 min-h-9 text-xs font-semibold bg-white ring-1 transition-colors",
                      isActive
                        ? "ring-[#E8621A]/50 text-[#E8621A]"
                        : "ring-black/[0.06] text-[#1A1A1A] hover:ring-[#E8621A]/40 hover:text-[#E8621A]",
                    )}
                  >
                    {shortLabel[cat.id] || cat.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
