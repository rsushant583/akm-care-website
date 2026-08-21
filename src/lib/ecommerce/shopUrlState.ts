import { DEFAULT_FILTERS } from "@/lib/ecommerce/filters";
import type { ShopFilters, SortOption } from "@/lib/ecommerce/types";
import { isShopCollection, type ShopCollectionId } from "@/data/catalog/categories";

const SORT_VALUES: SortOption[] = ["newest", "price-asc", "price-desc", "popularity", "discount"];

/** Accept Phase-3 alias without breaking existing `3-piece-suits` links. */
export function normalizeCategorySlug(raw: string | null | undefined): string {
  if (!raw || raw === "all") return "all";
  if (raw === "3-piece-suit") return "3-piece-suits";
  return raw;
}

export type ShopUrlState = {
  filters: ShopFilters;
  sort: SortOption;
  collection: ShopCollectionId | null;
};

export function parseShopSearchParams(sp: URLSearchParams): ShopUrlState {
  const collectionParam = sp.get("collection");
  const collection = isShopCollection(collectionParam) ? collectionParam : null;
  const sortRaw = sp.get("sort");
  let sort: SortOption = "newest";
  if (sortRaw && SORT_VALUES.includes(sortRaw as SortOption)) sort = sortRaw as SortOption;
  else if (collection === "deals") sort = "discount";

  const availabilityRaw = (sp.get("availability") || "").replace(/-/g, "_");
  const availability =
    availabilityRaw === "in_stock" || availabilityRaw === "out_of_stock" ? availabilityRaw : "all";

  const minRaw = sp.get("min");
  const maxRaw = sp.get("max");
  const priceMin = minRaw != null && minRaw !== "" && !Number.isNaN(Number(minRaw)) ? Number(minRaw) : null;
  const priceMax = maxRaw != null && maxRaw !== "" && !Number.isNaN(Number(maxRaw)) ? Number(maxRaw) : null;

  const colors = (sp.get("color") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const variants = (sp.get("variant") || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return {
    collection,
    sort,
    filters: {
      ...DEFAULT_FILTERS,
      category: normalizeCategorySlug(sp.get("category")),
      query: sp.get("q") ?? sp.get("query") ?? sp.get("search") ?? "",
      priceMin,
      priceMax,
      colors,
      variants,
      availability,
    },
  };
}

export function buildShopSearchParams(state: {
  filters: ShopFilters;
  sort: SortOption;
  collection?: ShopCollectionId | null;
  preserve?: URLSearchParams;
}): URLSearchParams {
  const next = new URLSearchParams();
  const { filters, sort, collection } = state;

  if (collection) next.set("collection", collection);
  if (filters.category && filters.category !== "all") next.set("category", filters.category);
  if (filters.query.trim()) next.set("q", filters.query.trim());
  if (sort && sort !== "newest") next.set("sort", sort);
  if (sort === "newest" && collection === "deals") next.set("sort", "discount");
  if (filters.priceMin != null) next.set("min", String(filters.priceMin));
  if (filters.priceMax != null) next.set("max", String(filters.priceMax));
  if (filters.colors.length) next.set("color", filters.colors.join(","));
  if (filters.variants.length) next.set("variant", filters.variants.join(","));
  if (filters.availability !== "all") next.set("availability", filters.availability);

  // Preserve non-discovery keys like interest briefly handled by Shop
  if (state.preserve) {
    for (const key of ["interest"] as const) {
      const v = state.preserve.get(key);
      if (v) next.set(key, v);
    }
  }

  return next;
}

export function countActiveShopFilters(filters: ShopFilters): number {
  let n = 0;
  if (filters.category !== "all") n += 1;
  if (filters.query.trim()) n += 1;
  if (filters.priceMin != null) n += 1;
  if (filters.priceMax != null) n += 1;
  if (filters.colors.length) n += filters.colors.length;
  if (filters.variants.length) n += filters.variants.length;
  if (filters.availability !== "all") n += 1;
  return n;
}

export const SHOP_SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "discount", label: "Discount" },
  { id: "popularity", label: "Popularity" },
];
