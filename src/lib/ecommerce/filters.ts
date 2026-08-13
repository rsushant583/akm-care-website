import type { CatalogProduct, ShopFilters, SortOption } from "./types";
import { getEffectivePrice } from "./pricing";
import { categoryMatchesProduct } from "@/data/catalog/categories";

export const DEFAULT_FILTERS: ShopFilters = {
  category: "all",
  priceMin: null,
  priceMax: null,
  colors: [],
  variants: [],
  availability: "all",
  query: "",
};

export function filterProducts(products: CatalogProduct[], filters: ShopFilters): CatalogProduct[] {
  const q = filters.query.trim().toLowerCase();

  return products.filter((p) => {
    if (filters.category !== "all") {
      if (!categoryMatchesProduct(filters.category, p)) return false;
    }

    const price = getEffectivePrice(p);
    if (filters.priceMin != null && price < filters.priceMin) return false;
    if (filters.priceMax != null && price > filters.priceMax) return false;

    if (filters.colors.length > 0) {
      const names = p.colors.map((c) => c.name.toLowerCase());
      if (!filters.colors.some((c) => names.includes(c.toLowerCase()))) return false;
    }

    if (filters.variants.length > 0) {
      const names = p.variants.map((v) => v.name.toLowerCase());
      if (!filters.variants.some((v) => names.includes(v.toLowerCase()))) return false;
    }

    if (filters.availability === "in_stock" && p.stock_quantity <= 0) return false;
    if (filters.availability === "out_of_stock" && p.stock_quantity > 0) return false;

    if (q) {
      const hay = [
        p.name,
        p.shortDescription,
        p.detailedDescription,
        p.sku,
        p.productCode,
        p.categoryLabel,
        p.brand ?? "AKM Care",
        ...p.tags,
        ...p.colors.map((c) => c.name),
        ...p.variants.map((v) => v.name),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

export function sortProducts(products: CatalogProduct[], sort: SortOption): CatalogProduct[] {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    case "price-desc":
      return list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    case "popularity":
      return list.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    case "discount":
      return list.sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
    case "newest":
    default:
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || a.displayOrder - b.displayOrder,
      );
  }
}

export function searchSuggestions(products: CatalogProduct[], query: string, limit = 8): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products
    .map((p) => {
      const fields = [p.name, p.sku, p.productCode, p.categoryLabel, p.brand ?? "AKM Care"];
      const score = fields.reduce((s, f) => {
        const v = f.toLowerCase();
        if (v === q) return s + 100;
        if (v.startsWith(q)) return s + 50;
        if (v.includes(q)) return s + 20;
        return s;
      }, 0);
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export function collectFilterFacets(products: CatalogProduct[]) {
  const categories = new Map<string, number>();
  const colors = new Map<string, number>();
  const variants = new Map<string, number>();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;

  for (const p of products) {
    categories.set(p.category, (categories.get(p.category) ?? 0) + 1);
    for (const c of p.colors) colors.set(c.name, (colors.get(c.name) ?? 0) + 1);
    for (const v of p.variants) variants.set(v.name, (variants.get(v.name) ?? 0) + 1);
    const price = getEffectivePrice(p);
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
  }

  return {
    categories: [...categories.entries()].map(([id, count]) => ({ id, count })),
    colors: [...colors.keys()].sort(),
    variants: [...variants.keys()].sort(),
    priceRange: {
      min: Number.isFinite(minPrice) ? minPrice : 0,
      max: maxPrice,
    },
  };
}
