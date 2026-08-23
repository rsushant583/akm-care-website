import {
  OFFICIAL_BROWSABLE_CATEGORIES,
  categoryMatchesProduct,
  type OfficialCategoryId,
} from "@/data/catalog/categories";
import { productPath } from "@/lib/ecommerce/slug";
import type { CatalogProduct } from "./types";

/** Official fashion categories prioritized for homepage hero rotation. */
export const FASHION_SPOTLIGHT_CATEGORY_PRIORITY: readonly OfficialCategoryId[] = [
  "sarees",
  "ladies-gown",
  "stitched-lehenga",
  "unstitched-lehenga",
  "semi-stitched-gown",
  "semi-stitched-lehenga",
  "semi-stitched-blouse",
] as const;

const DEFAULT_SPOTLIGHT_LIMIT = 8;
const MIN_CATEGORY_RAIL = 2;

export function uniqueProducts(lists: CatalogProduct[][], excludeIds?: Set<string>): CatalogProduct[] {
  const seen = new Set<string>(excludeIds ? [...excludeIds] : []);
  const out: CatalogProduct[] = [];
  for (const list of lists) {
    for (const product of list) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      out.push(product);
    }
  }
  return out;
}

export function hasUsableProductImage(product: CatalogProduct): boolean {
  const src = product.images[0]?.src || product.image_url;
  return Boolean(src && src.trim() && !src.includes("placeholder"));
}

/** Storefront-visible products only (matches productService published filter). */
export function isStorefrontVisibleProduct(product: CatalogProduct): boolean {
  const status = String(product.status || "").toLowerCase();
  if (status === "draft" || status === "archived") return false;
  return true;
}

function productCreatedMs(product: CatalogProduct): number {
  const ms = Date.parse(product.createdAt || "");
  return Number.isFinite(ms) ? ms : 0;
}

function fashionPriorityIndex(product: CatalogProduct): number {
  const idx = FASHION_SPOTLIGHT_CATEGORY_PRIORITY.findIndex((slug) =>
    categoryMatchesProduct(slug, product),
  );
  return idx === -1 ? FASHION_SPOTLIGHT_CATEGORY_PRIORITY.length : idx;
}

function sortNewestFirst(a: CatalogProduct, b: CatalogProduct): number {
  const byDate = productCreatedMs(b) - productCreatedMs(a);
  if (byDate !== 0) return byDate;
  return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
}

/**
 * Newest published products with usable images for New Arrivals automation.
 * Does not require the is_new_arrival flag — admin need not curate.
 */
export function pickNewestArrivals(
  products: CatalogProduct[],
  limit = 8,
  excludeIds?: Set<string>,
): CatalogProduct[] {
  const eligible = products
    .filter(isStorefrontVisibleProduct)
    .filter(hasUsableProductImage)
    .filter((p) => !(excludeIds && excludeIds.has(p.id)))
    .slice()
    .sort(sortNewestFirst);
  return eligible.slice(0, Math.max(0, limit));
}

/**
 * Latest fashion-forward products for hero spotlight rotation.
 * Prefer priority categories; fill from other visible products if needed.
 */
export function pickLatestSpotlightProducts(
  products: CatalogProduct[],
  limit = DEFAULT_SPOTLIGHT_LIMIT,
): CatalogProduct[] {
  const max = Math.max(0, Math.min(limit, DEFAULT_SPOTLIGHT_LIMIT));
  if (max === 0) return [];

  const eligible = products
    .filter(isStorefrontVisibleProduct)
    .filter(hasUsableProductImage)
    .filter((p) => {
      // Must map to at least one official browsable category when possible;
      // legacy/unknown categories still allowed as fill after fashion priority.
      return Boolean(p.category || p.categoryLabel);
    });

  // Fashion categories first (newest uploaded), then other categories as fill.
  // Within fashion, prefer lower priority-index on equal timestamps.
  const fashion = eligible
    .filter((p) => fashionPriorityIndex(p) < FASHION_SPOTLIGHT_CATEGORY_PRIORITY.length)
    .slice()
    .sort((a, b) => {
      const byDate = sortNewestFirst(a, b);
      if (byDate !== 0) return byDate;
      return fashionPriorityIndex(a) - fashionPriorityIndex(b);
    });

  const rest = eligible
    .filter((p) => fashionPriorityIndex(p) >= FASHION_SPOTLIGHT_CATEGORY_PRIORITY.length)
    .slice()
    .sort(sortNewestFirst);

  const seenIds = new Set<string>();
  const seenSrc = new Set<string>();
  const out: CatalogProduct[] = [];

  for (const product of [...fashion, ...rest]) {
    if (seenIds.has(product.id)) continue;
    const src = product.images[0]?.src || product.image_url;
    if (!src || seenSrc.has(src)) continue;
    seenIds.add(product.id);
    seenSrc.add(src);
    out.push(product);
    if (out.length >= max) break;
  }

  return out;
}

export type LookbookSlide = {
  featured: CatalogProduct;
  supporting: CatalogProduct[];
};

const DEFAULT_SUPPORTING = 3;

function categoryKey(product: CatalogProduct): string {
  return String(product.category || product.categoryLabel || "")
    .trim()
    .toLowerCase();
}

/**
 * Pick supporting looks for a featured product from the spotlight pool.
 * Prefer different categories; never repeat the featured product; fill gracefully.
 */
export function pickLookbookSupporting(
  pool: CatalogProduct[],
  featured: CatalogProduct,
  limit = DEFAULT_SUPPORTING,
): CatalogProduct[] {
  const max = Math.max(0, Math.min(limit, DEFAULT_SUPPORTING));
  if (max === 0 || pool.length === 0) return [];

  const remaining = pool.filter((p) => p.id !== featured.id);
  if (remaining.length === 0) return [];

  const featuredCat = categoryKey(featured);
  const out: CatalogProduct[] = [];
  const used = new Set<string>();
  const usedCats = new Set<string>(featuredCat ? [featuredCat] : []);

  // Pass 1 — different category (keeps lookbook variety).
  for (const product of remaining) {
    if (out.length >= max) break;
    const cat = categoryKey(product);
    if (cat && usedCats.has(cat)) continue;
    out.push(product);
    used.add(product.id);
    if (cat) usedCats.add(cat);
  }

  // Pass 2 — fill remaining slots without duplicates.
  for (const product of remaining) {
    if (out.length >= max) break;
    if (used.has(product.id)) continue;
    out.push(product);
    used.add(product.id);
  }

  return out;
}

/**
 * Build rotating lookbook compositions from the spotlight pool.
 * Each slide promotes one featured product and 0–3 supporting looks.
 */
export function buildLookbookSlides(
  products: CatalogProduct[],
  supportingCount = DEFAULT_SUPPORTING,
): LookbookSlide[] {
  if (!products.length) return [];
  return products.map((featured) => ({
    featured,
    supporting: pickLookbookSupporting(products, featured, supportingCount),
  }));
}

/** First real catalog image per official category. Never invents imagery. */
export function pickCategoryImages(products: CatalogProduct[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const cat of OFFICIAL_BROWSABLE_CATEGORIES) {
    const match = products.find((product) => {
      if (!categoryMatchesProduct(cat.id, product)) return false;
      return hasUsableProductImage(product);
    });
    const src = match?.images[0]?.src || match?.image_url;
    if (src) map[cat.id] = src;
  }
  return map;
}

export function pickHeroTiles(
  products: CatalogProduct[],
  limit = 3,
): { src: string; alt: string; href: string }[] {
  const seen = new Set<string>();
  const tiles: { src: string; alt: string; href: string }[] = [];
  for (const product of products) {
    if (!isStorefrontVisibleProduct(product)) continue;
    const src = product.images[0]?.src || product.image_url;
    if (!src || seen.has(src)) continue;
    seen.add(src);
    tiles.push({ src, alt: product.name, href: productPath(product.slug) });
    if (tiles.length >= limit) break;
  }
  return tiles;
}

export type HomeCategoryRailSpec = {
  id: string;
  title: string;
  categoryIds: OfficialCategoryId[];
  href: string;
};

/** Merchandising rails that materially help discovery — only render when filled. */
export const HOME_CATEGORY_RAIL_SPECS: readonly HomeCategoryRailSpec[] = [
  {
    id: "sarees",
    title: "Sarees",
    categoryIds: ["sarees"],
    href: "/shop?category=sarees",
  },
  {
    id: "ladies-gowns",
    title: "Ladies Gowns",
    categoryIds: ["ladies-gown"],
    href: "/shop?category=ladies-gown",
  },
  {
    id: "lehengas",
    title: "Lehengas",
    categoryIds: ["stitched-lehenga", "unstitched-lehenga"],
    href: "/shop?category=stitched-lehenga",
  },
  {
    id: "semi-stitched",
    title: "Semi-Stitched",
    categoryIds: ["semi-stitched-gown", "semi-stitched-lehenga", "semi-stitched-blouse"],
    href: "/shop?category=semi-stitched-gown",
  },
] as const;

/**
 * Build a category rail only when there are enough products with usable images.
 * Does not invent empty sections.
 */
export function pickCategoryRailProducts(
  products: CatalogProduct[],
  categoryIds: OfficialCategoryId[],
  limit = 8,
  excludeIds?: Set<string>,
  minItems = MIN_CATEGORY_RAIL,
): CatalogProduct[] {
  const matched = products
    .filter(isStorefrontVisibleProduct)
    .filter(hasUsableProductImage)
    .filter((p) => !(excludeIds && excludeIds.has(p.id)))
    .filter((p) => categoryIds.some((id) => categoryMatchesProduct(id, p)))
    .slice()
    .sort(sortNewestFirst);

  const unique = uniqueProducts([matched]);
  if (unique.length < minItems) return [];
  return unique.slice(0, limit);
}
