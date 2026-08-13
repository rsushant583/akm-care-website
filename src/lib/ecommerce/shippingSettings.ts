import { getSupabaseClient } from "@/lib/supabaseClient";

export type StorefrontShippingConfig = {
  standard: number;
  express: number;
  freeAbove: number;
};

export const DEFAULT_SHIPPING_CONFIG: StorefrontShippingConfig = {
  standard: 49,
  express: 99,
  freeAbove: 999,
};

/** Display-only shipping config — final charge is always computed server-side. */
export async function loadStorefrontShippingConfig(): Promise<StorefrontShippingConfig> {
  const client = getSupabaseClient();
  if (!client) return DEFAULT_SHIPPING_CONFIG;
  try {
    const { data, error } = await client.from("site_settings").select("value").eq("key", "shipping").maybeSingle();
    if (error || !data?.value) return DEFAULT_SHIPPING_CONFIG;
    const value = data.value as Record<string, unknown>;
    return {
      standard: Number(value.standard ?? DEFAULT_SHIPPING_CONFIG.standard) || DEFAULT_SHIPPING_CONFIG.standard,
      express: Number(value.express ?? DEFAULT_SHIPPING_CONFIG.express) || DEFAULT_SHIPPING_CONFIG.express,
      freeAbove: Number(value.free_above ?? DEFAULT_SHIPPING_CONFIG.freeAbove) || DEFAULT_SHIPPING_CONFIG.freeAbove,
    };
  } catch {
    return DEFAULT_SHIPPING_CONFIG;
  }
}

export function estimateShippingTotal(
  method: "standard" | "express",
  subtotal: number,
  cfg: StorefrontShippingConfig,
  freeShippingCoupon = false,
): number {
  if (freeShippingCoupon) return 0;
  if (subtotal >= cfg.freeAbove) return 0;
  return method === "express" ? cfg.express : cfg.standard;
}
