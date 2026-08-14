import { Link } from "react-router-dom";
import { OFFICIAL_BROWSABLE_CATEGORIES, shopCategoryPath } from "@/data/catalog/categories";

const categoryHints: Record<string, string> = {
  sarees: "Elegant traditional sarees",
  "ladies-gown": "Contemporary styles",
  "stitched-lehenga": "Wedding & festive wear",
  "unstitched-lehenga": "Custom craft",
  "3-piece-suits": "Salwar + Dupatta",
  "mens-jeans": "Everyday denim",
};

const shortLabel: Record<string, string> = {
  "3-piece-suits": "3-Piece Suit",
  "ladies-gown": "Ladies Gown",
  "stitched-lehenga": "Stitched Lehenga",
  "unstitched-lehenga": "Unstitched Lehenga",
};

export default function HomeCategoryStrip({ images }: { images?: Record<string, string> }) {
  return (
    <section className="bg-white" aria-labelledby="shop-by-category-heading">
      <div className="container-premium home-section">
        <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-1.5">
              Shop by category
            </p>
            <h2 id="shop-by-category-heading" className="type-section text-[1.65rem] sm:text-3xl">
              Find what you love
            </h2>
          </div>
          <Link to="/shop" className="btn-tertiary shrink-0">
            View all
          </Link>
        </div>

        <div
          className="-mx-4 px-4 sm:mx-0 sm:px-0 flex lg:grid lg:grid-cols-6 gap-2.5 lg:gap-3 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none scrollbar-hide"
          role="list"
          aria-label="Product categories"
        >
          {OFFICIAL_BROWSABLE_CATEGORIES.map((cat) => {
            const src = images?.[cat.id] || cat.imageSrc;
            return (
              <Link
                key={cat.id}
                to={shopCategoryPath(cat.id)}
                role="listitem"
                className="snap-start shrink-0 w-[9.25rem] sm:w-[10.75rem] lg:w-auto lg:shrink
                  group relative aspect-[4/5] overflow-hidden bg-[#F5F0EB]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
              >
                {src ? (
                  <img
                    src={src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[center_22%] motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-[#EDE8E2] to-[#E8DFD6]"
                    aria-hidden
                  />
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                  aria-hidden
                />
                <div className="relative z-10 flex h-full flex-col justify-end p-2.5 lg:p-3">
                  <p className="font-heading text-[0.95rem] lg:text-base text-white leading-snug">
                    {shortLabel[cat.id] || cat.label}
                  </p>
                  <p className="text-[11px] text-white/80 mt-0.5 line-clamp-1">{categoryHints[cat.id]}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
