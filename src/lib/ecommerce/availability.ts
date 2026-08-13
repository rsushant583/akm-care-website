/** Single source of truth for storefront purchasability. */

export function getAvailableQuantity(product: {
  stock_quantity?: number | null;
  quantity?: number | null;
}): number {
  const raw = product.stock_quantity ?? product.quantity ?? 0;
  const qty = Number(raw);
  if (!Number.isFinite(qty)) return 0;
  return Math.max(0, Math.floor(qty));
}

export function isProductInStock(product: {
  stock_quantity?: number | null;
  quantity?: number | null;
}): boolean {
  return getAvailableQuantity(product) > 0;
}
