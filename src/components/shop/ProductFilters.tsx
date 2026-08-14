import type { ShopFilters, SortOption } from "@/lib/ecommerce/types";
import { OFFICIAL_SHOP_CATEGORIES } from "@/data/catalog/categories";
import { SHOP_SORT_OPTIONS } from "@/lib/ecommerce/shopUrlState";
import { cn } from "@/lib/utils";

type Facets = {
  colors: string[];
  variants: string[];
  priceRange: { min: number; max: number };
};

export function ProductFilters({
  filters,
  sort,
  facets,
  onChange,
  onSortChange,
  onReset,
  className,
  showSort = true,
  idPrefix = "shop-filter",
}: {
  filters: ShopFilters;
  sort: SortOption;
  facets: Facets;
  onChange: (next: ShopFilters) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
  className?: string;
  showSort?: boolean;
  idPrefix?: string;
}) {
  const toggleList = (key: "colors" | "variants", value: string) => {
    const set = new Set(filters[key]);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ ...filters, [key]: [...set] });
  };

  return (
    <aside className={cn("space-y-6", className)} aria-label="Product filters">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg" id={`${idPrefix}-heading`}>
          Filters
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-[#E8621A] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40 rounded"
        >
          Clear all
        </button>
      </div>

      {showSort && (
        <div>
          <label htmlFor={`${idPrefix}-sort`} className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2 block">
            Sort
          </label>
          <select
            id={`${idPrefix}-sort`}
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
          >
            {SHOP_SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2" id={`${idPrefix}-category-label`}>
          Category
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${idPrefix}-category-label`}>
          {OFFICIAL_SHOP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={filters.category === cat.id}
              onClick={() => onChange({ ...filters, category: cat.id })}
              className={cn(
                "px-3 py-1.5 min-h-9 rounded-full text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
                filters.category === cat.id
                  ? "bg-[#E8621A] text-white border-[#E8621A]"
                  : "bg-white text-[#6B6B6B] border-black/[0.08] hover:border-[#E8621A]/40",
              )}
            >
              {cat.label === "All" ? "All products" : cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2">Price (₹)</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-min`}>
            Minimum price
          </label>
          <input
            id={`${idPrefix}-min`}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={`Min ${facets.priceRange.min || 0}`}
            value={filters.priceMin ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                priceMin: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="px-3 py-2 rounded-xl border border-black/[0.08] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
          />
          <label className="sr-only" htmlFor={`${idPrefix}-max`}>
            Maximum price
          </label>
          <input
            id={`${idPrefix}-max`}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={`Max ${facets.priceRange.max || ""}`}
            value={filters.priceMax ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                priceMax: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="px-3 py-2 rounded-xl border border-black/[0.08] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
          />
        </div>
      </div>

      {facets.colors.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2" id={`${idPrefix}-color-label`}>
            Colour
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${idPrefix}-color-label`}>
            {facets.colors.map((color) => (
              <button
                key={color}
                type="button"
                aria-pressed={filters.colors.includes(color)}
                onClick={() => toggleList("colors", color)}
                className={cn(
                  "px-3 py-1.5 min-h-9 rounded-full text-xs font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
                  filters.colors.includes(color)
                    ? "border-[#E8621A] bg-[#E8621A]/10 text-[#E8621A]"
                    : "border-black/[0.08] text-[#6B6B6B]",
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {facets.variants.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2" id={`${idPrefix}-variant-label`}>
            Variant
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${idPrefix}-variant-label`}>
            {facets.variants.map((variant) => (
              <button
                key={variant}
                type="button"
                aria-pressed={filters.variants.includes(variant)}
                onClick={() => toggleList("variants", variant)}
                className={cn(
                  "px-3 py-1.5 min-h-9 rounded-full text-xs font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
                  filters.variants.includes(variant)
                    ? "border-[#E8621A] bg-[#E8621A]/10 text-[#E8621A]"
                    : "border-black/[0.08] text-[#6B6B6B]",
                )}
              >
                {variant}
              </button>
            ))}
          </div>
        </div>
      )}

      <fieldset className="border-0 p-0 m-0">
        <legend className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2">Availability</legend>
        <div className="space-y-2">
          {(
            [
              ["all", "All"],
              ["in_stock", "In Stock"],
              ["out_of_stock", "Out of Stock"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="flex items-center gap-2 text-sm text-[#1A1A1A]/80 cursor-pointer">
              <input
                type="radio"
                name={`${idPrefix}-availability`}
                checked={filters.availability === id}
                onChange={() => onChange({ ...filters, availability: id })}
                className="accent-[#E8621A]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </aside>
  );
}
