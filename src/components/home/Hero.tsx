import { Link } from "react-router-dom";
import { OFFICIAL_BROWSABLE_CATEGORIES, shopCategoryPath, shopCollectionPath } from "@/data/catalog/categories";
import { productPath } from "@/lib/ecommerce/slug";
import { cn } from "@/lib/utils";

export type HeroTile = {
  src: string;
  alt: string;
  href?: string;
};

const TURQUOISE_COVER =
  "https://tdqepnmysycxklqcvpai.supabase.co/storage/v1/object/public/products/akmc-turquoise-zari/image-01.webp";

/** Real catalog paths for first paint — replaced by live tiles when catalog loads. */
const SEED_TILES: HeroTile[] = [
  {
    src: TURQUOISE_COVER,
    alt: "AKMC Turquoise Zari Silk Saree",
    href: productPath("akmc-turquoise-zari"),
  },
  { src: "/catalog/akmc-rooh-0002/01.png", alt: "AKMC ROOH saree", href: productPath("akmc-rooh-0002") },
  { src: "/catalog/akmc-sani-1007/01.png", alt: "AKMC SANI saree", href: productPath("akmc-sani-1007") },
];

const shortLabel: Record<string, string> = {
  "3-piece-suits": "3-Piece Suit",
  "ladies-gown": "Gowns",
  "stitched-lehenga": "Stitched Lehenga",
  "unstitched-lehenga": "Unstitched Lehenga",
  "mens-jeans": "Men's Jeans",
};

function HeroMosaic({ tiles, priority }: { tiles: HeroTile[]; priority?: boolean }) {
  const shown = tiles.slice(0, 3);
  if (shown.length === 0) {
    return <div className="h-full min-h-[12rem] bg-[#EDE8E2]" aria-hidden />;
  }

  const Tile = ({ tile, className, eager }: { tile: HeroTile; className?: string; eager?: boolean }) => {
    const img = (
      <img
        src={tile.src}
        alt={tile.alt}
        className="absolute inset-0 h-full w-full product-photo"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        width={640}
        height={800}
      />
    );
    const body = (
      <div className={cn("relative overflow-hidden bg-[#EDE8E2]", className)}>
        {img}
      </div>
    );
    if (!tile.href) return body;
    return (
      <Link to={tile.href} className={cn("relative overflow-hidden bg-[#EDE8E2] block", className)} aria-label={tile.alt}>
        {img}
      </Link>
    );
  };

  if (shown.length === 1) {
    return <Tile tile={shown[0]} className="h-full min-h-[12rem] lg:min-h-full" eager={priority} />;
  }

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 sm:gap-2 h-full min-h-[13.5rem] sm:min-h-[16rem] lg:min-h-[22rem]">
      <Tile tile={shown[0]} className="row-span-2" eager={priority} />
      <Tile tile={shown[1]} eager={false} />
      {shown[2] ? (
        <Tile tile={shown[2]} eager={false} />
      ) : (
        <div className="bg-[#E8DFD6]" aria-hidden />
      )}
    </div>
  );
}

/**
 * Marketplace-first homepage hero.
 * Uses live catalog photography when provided; seed catalog paths otherwise.
 * Does not use the corporate collage as the primary visual.
 */
export default function Hero({ tiles }: { tiles?: HeroTile[] }) {
  const mosaic = tiles && tiles.length > 0 ? tiles : SEED_TILES;

  return (
    <section className="relative overflow-hidden bg-[#F5F0EB]">
      <div className="container-premium relative z-10 py-4 sm:py-5 lg:py-6">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 items-stretch">
          <div className="order-1 lg:order-2 min-h-0">
            <HeroMosaic tiles={mosaic} priority />
          </div>

          <div className="order-2 lg:order-1 flex flex-col justify-center min-w-0 py-1">
            <p className="text-[0.65rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-2">
              AKM Care Shop
            </p>

            <h1 className="font-heading text-[1.65rem] sm:text-[2.1rem] lg:text-[2.45rem] leading-[1.12] tracking-tight text-[#1A1A1A] mb-2.5" style={{ textWrap: "balance" }}>
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
              Pan-India delivery · 7-day returns · Secure checkout
            </p>

            <div className="flex flex-wrap gap-1.5" aria-label="Browse categories">
              {OFFICIAL_BROWSABLE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  to={shopCategoryPath(cat.id)}
                  className="px-3 py-1.5 min-h-9 text-xs font-semibold bg-white ring-1 ring-black/[0.06] text-[#1A1A1A] hover:ring-[#E8621A]/40 hover:text-[#E8621A] transition-colors"
                >
                  {shortLabel[cat.id] || cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
