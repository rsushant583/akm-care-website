import type { CartLineItem, CatalogProduct } from "@/lib/ecommerce/types";
import { getEffectivePrice } from "@/lib/ecommerce/pricing";

export const GA4_CURRENCY = "INR" as const;

export type GA4Item = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price: number;
  quantity: number;
};

export type OrderLineForGA4 = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
};

function isMeaningfulId(value?: string | null): value is string {
  if (!value) return false;
  const t = value.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  return !(lower === "na" || lower === "n/a" || lower === "-" || lower === "—");
}

/** Prefer stable catalog SKU/product code; fall back to product UUID. */
export function resolveItemId(input: {
  productId: string;
  sku?: string | null;
  productCode?: string | null;
}): string {
  if (isMeaningfulId(input.productCode)) return input.productCode.trim();
  if (isMeaningfulId(input.sku)) return input.sku.trim();
  return input.productId;
}

export function toGA4Item(
  product: CatalogProduct,
  quantity = 1,
): GA4Item {
  return {
    item_id: resolveItemId({
      productId: product.id,
      sku: product.sku,
      productCode: product.productCode,
    }),
    item_name: product.name,
    item_brand: product.brand || undefined,
    item_category: product.categoryLabel || product.category || undefined,
    price: getEffectivePrice(product),
    quantity: Math.max(1, quantity),
  };
}

export function toGA4Items(products: CatalogProduct[], quantity = 1): GA4Item[] {
  return products.map((p) => toGA4Item(p, quantity));
}

export function toGA4ItemFromCartLine(line: CartLineItem): GA4Item {
  return {
    item_id: resolveItemId({
      productId: line.productId,
      sku: line.sku,
    }),
    item_name: line.name,
    price: line.unitPrice,
    quantity: line.quantity,
  };
}

export function toGA4ItemsFromCartLines(lines: CartLineItem[]): GA4Item[] {
  return lines.map(toGA4ItemFromCartLine);
}

export function toGA4ItemFromOrderLine(line: OrderLineForGA4): GA4Item {
  return {
    item_id: resolveItemId({
      productId: line.productId,
      sku: line.sku,
    }),
    item_name: line.productName,
    item_brand: line.brand || undefined,
    item_category: line.category || undefined,
    price: Number(line.unitPrice) || 0,
    quantity: Math.max(1, Number(line.quantity) || 1),
  };
}

export function toGA4ItemsFromOrderLines(lines: OrderLineForGA4[]): GA4Item[] {
  return lines.map(toGA4ItemFromOrderLine);
}

export function cartLinesValue(lines: CartLineItem[]): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}
