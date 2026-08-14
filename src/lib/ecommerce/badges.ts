import type { CatalogProduct } from "./types";
import { getAvailableQuantity, isProductInStock } from "./availability";
import { displayDiscountPercent } from "./pricing";

export const LOW_STOCK_THRESHOLD = 5;

export type ProductBadgeKind = "sale" | "new" | "low-stock" | "bestseller" | "featured";

export type ProductBadge = {
  kind: ProductBadgeKind;
  label: string;
};

/**
 * Truthful storefront badges only. Never fabricate popularity, reviews, or discounts.
 */
export function getProductBadges(product: CatalogProduct, max = 2): ProductBadge[] {
  const badges: ProductBadge[] = [];
  const qty = getAvailableQuantity(product);
  const discount = displayDiscountPercent(product.discountPercent);

  if (discount > 0) {
    badges.push({ kind: "sale", label: `${discount}% OFF` });
  }
  if (product.isNewArrival) {
    badges.push({ kind: "new", label: "New" });
  }
  if (isProductInStock(product) && qty > 0 && qty <= LOW_STOCK_THRESHOLD) {
    badges.push({ kind: "low-stock", label: "Low stock" });
  }
  if (product.isBestSeller) {
    badges.push({ kind: "bestseller", label: "Bestseller" });
  }
  if (product.isFeatured) {
    badges.push({ kind: "featured", label: "Featured" });
  }

  return badges.slice(0, max);
}

export function getStockLabel(product: CatalogProduct): { text: string; tone: "ok" | "low" | "out" } | null {
  const qty = getAvailableQuantity(product);
  if (!isProductInStock(product) || qty <= 0) {
    return { text: "Out of stock", tone: "out" };
  }
  if (qty <= LOW_STOCK_THRESHOLD) {
    return { text: "Low stock", tone: "low" };
  }
  return null;
}
