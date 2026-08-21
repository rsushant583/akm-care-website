/**
 * Store-level shipping / returns facts used by PDP fallback, FAQ, and /shipping-returns.
 * Charges live in shippingSettings.ts (checkout). Windows live here.
 * Product rows may still set a different `shipping_time` — that is catalog-specific, not a guess.
 */

export const SHIPPING_POLICY = {
  area: "pan-India",
  standardWindow: "3–5 business days",
  expressWindow: "1–2 business days",
  returnWindowDays: 7,
  returnSummary: "7 days return policy — unused product with original packing",
} as const;

export function isCustomShippingWindow(value?: string | null): boolean {
  if (!value) return false;
  const t = value.trim().toLowerCase();
  if (!t) return false;
  return t !== SHIPPING_POLICY.standardWindow.toLowerCase();
}

/** PDP copy: catalog window when present; otherwise the store standard. Never invents a SKU-specific time. */
export function formatProductShippingCopy(catalogWindow?: string | null): string {
  const value = (catalogWindow || "").trim();
  if (!value) {
    return `${SHIPPING_POLICY.standardWindow} (${SHIPPING_POLICY.area}). Checkout confirms the date.`;
  }
  if (isCustomShippingWindow(value)) {
    return `${value} (this product’s catalog window). Store standard is ${SHIPPING_POLICY.standardWindow}; checkout confirms the date.`;
  }
  return `${value} (${SHIPPING_POLICY.area}). Checkout confirms the date.`;
}
