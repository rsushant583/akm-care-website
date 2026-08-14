import { OFFICIAL_BROWSABLE_CATEGORIES, categoryMatchesProduct } from "@/data/catalog/categories";
import { productPath } from "@/lib/ecommerce/slug";
import type { CatalogProduct } from "./types";

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

/** First real catalog image per official category. Never invents imagery. */
export function pickCategoryImages(products: CatalogProduct[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const cat of OFFICIAL_BROWSABLE_CATEGORIES) {
    const match = products.find((product) => {
      if (!categoryMatchesProduct(cat.id, product)) return false;
      return Boolean(product.images[0]?.src || product.image_url);
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
    const src = product.images[0]?.src || product.image_url;
    if (!src || seen.has(src)) continue;
    seen.add(src);
    tiles.push({ src, alt: product.name, href: productPath(product.slug) });
    if (tiles.length >= limit) break;
  }
  return tiles;
}
