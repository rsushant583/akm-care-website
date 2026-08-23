import {
  OFFICIAL_BROWSABLE_CATEGORIES,
  categoryMatchesProduct,
  type OfficialCategoryId,
} from "@/data/catalog/categories";
import { productPath } from "@/lib/ecommerce/slug";
import type { CatalogProduct } from "./types";

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

export type HeroCategoryCollage = {
  categoryId: OfficialCategoryId;
  tiles: { src: string; alt: string; href: string }[];
};

const HERO_COLLAGE_SIZE = 3;

function isUsableImageSrc(src?: string | null): boolean {
  return Boolean(src && src.trim() && !src.includes("placeholder"));
}

/**
 * Collect up to `limit` visual assets for one category.
 * Priority: distinct product primaries → additional gallery images on those products.
 * Never mixes categories; never invents imagery.
 */
export function collectCategoryHeroAssets(
  products: CatalogProduct[],
  categoryId: OfficialCategoryId,
  limit = HERO_COLLAGE_SIZE,
): { src: string; alt: string; href: string }[] {
  const max = Math.max(1, limit);
  const matched = products
    .filter(isStorefrontVisibleProduct)
    .filter((p) => categoryMatchesProduct(categoryId, p))
    .slice()
    .sort(sortNewestFirst);

  const seenSrc = new Set<string>();
  const tiles: { src: string; alt: string; href: string }[] = [];

  const push = (src: string, alt: string, href: string) => {
    if (tiles.length >= max) return;
    if (!isUsableImageSrc(src) || seenSrc.has(src)) return;
    seenSrc.add(src);
    tiles.push({ src, alt, href });
  };

  // Pass 1 — primary image per product (newest first).
  for (const product of matched) {
    const primary = product.images[0]?.src || product.image_url;
    push(primary, product.name, productPath(product.slug));
    if (tiles.length >= max) return tiles;
  }

  // Pass 2 — additional gallery frames from the same products.
  for (const product of matched) {
    const href = productPath(product.slug);
    for (let i = 1; i < (product.images?.length || 0); i++) {
      const img = product.images[i];
      push(img.src, img.alt || product.name, href);
      if (tiles.length >= max) return tiles;
    }
  }

  return tiles;
}

/**
 * Build per-category hero collages from real catalog visuals.
 * Eligible when ≥1 usable asset exists. Categories with 0 assets are omitted.
 * Tiles may be 1–3; the hero fills remaining mosaic cells with neutral plates.
 */
export function buildHeroCategoryCollages(
  products: CatalogProduct[],
  tileCount = HERO_COLLAGE_SIZE,
): HeroCategoryCollage[] {
  const out: HeroCategoryCollage[] = [];

  for (const cat of OFFICIAL_BROWSABLE_CATEGORIES) {
    const tiles = collectCategoryHeroAssets(products, cat.id, tileCount);
    if (tiles.length >= 1) {
      out.push({ categoryId: cat.id, tiles });
    }
  }

  return out;
}

/** Dev/test helper: asset counts per official category (no logging). */
export function getHeroCategoryAssetSummary(
  products: CatalogProduct[],
): { categoryId: OfficialCategoryId; assetCount: number; eligible: boolean }[] {
  return OFFICIAL_BROWSABLE_CATEGORIES.map((cat) => {
    const assetCount = collectCategoryHeroAssets(products, cat.id, HERO_COLLAGE_SIZE).length;
    return { categoryId: cat.id, assetCount, eligible: assetCount >= 1 };
  });
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
