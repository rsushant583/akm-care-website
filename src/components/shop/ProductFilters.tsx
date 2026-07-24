import type { ShopFilters, SortOption } from "@/lib/ecommerce/types";
import { SHOP_CATEGORIES } from "@/data/catalog/products";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low → High" },
  { id: "price-desc", label: "Price: High → Low" },
  { id: "popularity", label: "Popularity" },
  { id: "discount", label: "Discount" },
];

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
}: {
  filters: ShopFilters;
  sort: SortOption;
  facets: Facets;
  onChange: (next: ShopFilters) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
  className?: string;
}) {
  const toggleList = (key: "colors" | "variants", value: string) => {
    const set = new Set(filters[key]);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ ...filters, [key]: [...set] });
  };

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg">Filters</h2>
        <button type="button" onClick={onReset} className="text-xs font-semibold text-[#E8621A] hover:underline">
          Reset
        </button>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2">Sort</p>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] bg-white text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          {SHOP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange({ ...filters, category: cat.id })}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                filters.category === cat.id
                  ? "bg-[#E8621A] text-white border-[#E8621A]"
                  : "bg-white text-[#6B6B6B] border-black/[0.08] hover:border-[#E8621A]/40",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2">Price (₹)</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder={`Min ${facets.priceRange.min || 0}`}
            value={filters.priceMin ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                priceMin: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="px-3 py-2 rounded-xl border border-black/[0.08] text-sm"
          />
          <input
            type="number"
            min={0}
            placeholder={`Max ${facets.priceRange.max || ""}`}
            value={filters.priceMax ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                priceMax: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="px-3 py-2 rounded-xl border border-black/[0.08] text-sm"
          />
        </div>
      </div>

      {facets.colors.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleList("colors", color)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border",
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
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2">Variant</p>
          <div className="flex flex-wrap gap-2">
            {facets.variants.map((variant) => (
              <button
                key={variant}
                type="button"
                onClick={() => toggleList("variants", variant)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border",
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

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-2">Availability</p>
        <div className="space-y-2">
          {(
            [
              ["all", "All"],
              ["in_stock", "In Stock"],
              ["out_of_stock", "Out of Stock"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="flex items-center gap-2 text-sm text-[#1A1A1A]/80">
              <input
                type="radio"
                name="availability"
                checked={filters.availability === id}
                onChange={() => onChange({ ...filters, availability: id })}
                className="accent-[#E8621A]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
