import { Link } from "react-router-dom";
import { OFFICIAL_BROWSABLE_CATEGORIES, shopCategoryPath } from "@/data/catalog/categories";

const categoryHints: Record<string, string> = {
  sarees: "Traditional weaves",
  "ladies-gown": "Elegant evening wear",
  "stitched-lehenga": "Ready to wear",
  "unstitched-lehenga": "Custom craft",
  "3-piece-suits": "Salwar + Dupatta",
  "mens-jeans": "Everyday denim",
};

const shortLabel: Record<string, string> = {
  "3-piece-suits": "3-Piece Suit",
};

export default function HomeCategoryStrip() {
  return (
    <section className="bg-white border-y border-black/[0.04]" aria-labelledby="shop-by-category-heading">
      <div className="container-premium py-8 sm:py-10 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-2">
              Shop by category
            </p>
            <h2 id="shop-by-category-heading" className="type-section">
              Find what you love
            </h2>
          </div>
          <Link to="/shop" className="btn-tertiary self-start sm:self-auto">
            View all products
          </Link>
        </div>

        <div
          className="-mx-4 px-4 sm:mx-0 sm:px-0 flex lg:grid lg:grid-cols-6 gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none scrollbar-hide pb-1"
          role="list"
          aria-label="Product categories"
        >
          {OFFICIAL_BROWSABLE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={shopCategoryPath(cat.id)}
              role="listitem"
              className="snap-start shrink-0 w-[9.5rem] sm:w-[11rem] lg:w-auto lg:shrink
                group aspect-[3/4] flex flex-col justify-end p-4 lg:p-5
                bg-[#F5F0EB] ring-1 ring-black/[0.06] hover:ring-[#E8621A]/40 hover:bg-[#FAF8F5] transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
            >
              <p className="font-heading text-base lg:text-lg text-[#1A1A1A] group-hover:text-[#E8621A] transition-colors leading-snug">
                <span className="lg:hidden">{shortLabel[cat.id] || cat.label}</span>
                <span className="hidden lg:inline">{cat.label}</span>
              </p>
              <p className="type-meta mt-1 lg:mt-1.5">{categoryHints[cat.id]}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
