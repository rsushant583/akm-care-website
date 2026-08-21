import { getSupabaseClient } from "@/lib/supabaseClient";

export type CouponPreview = {
  enteredCode: string;
  normalizedCode: string;
  appliedCode: string | null;
  discountAmount: number;
  freeShipping: boolean;
  valid: boolean;
  message: string | null;
};

export async function previewCouponDiscount(
  code: string,
  subtotal: number,
): Promise<CouponPreview> {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) {
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: null,
      discountAmount: 0,
      freeShipping: false,
      valid: false,
      message: null,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: null,
      discountAmount: 0,
      freeShipping: false,
      valid: false,
      message: "Coupons are unavailable right now.",
    };
  }

  const { data: coupon, error } = await client
    .from("coupons")
    .select("*")
    .eq("code", normalizedCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: null,
      discountAmount: 0,
      freeShipping: false,
      valid: false,
      message: "Coupon code not found or inactive.",
    };
  }

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: null,
      discountAmount: 0,
      freeShipping: false,
      valid: false,
      message: "This coupon is not active yet.",
    };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: null,
      discountAmount: 0,
      freeShipping: false,
      valid: false,
      message: "This coupon has expired.",
    };
  }
  if (coupon.usage_limit != null && Number(coupon.used_count ?? 0) >= Number(coupon.usage_limit)) {
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: null,
      discountAmount: 0,
      freeShipping: false,
      valid: false,
      message: "This coupon has reached its usage limit.",
    };
  }

  const minPurchase = Number(coupon.min_purchase ?? 0);
  if (subtotal < minPurchase) {
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: null,
      discountAmount: 0,
      freeShipping: false,
      valid: false,
      message: `Add ${Math.ceil(minPurchase - subtotal)} more to use this coupon.`,
    };
  }

  if (coupon.discount_type === "free_shipping") {
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: normalizedCode,
      discountAmount: 0,
      freeShipping: true,
      valid: true,
      message: "Free shipping will be applied at checkout.",
    };
  }

  if (coupon.discount_type === "percentage") {
    const pct = Math.max(0, Math.min(100, Number(coupon.discount_value ?? 0)));
    const discountAmount = Math.round((subtotal * pct) / 100);
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: normalizedCode,
      discountAmount,
      freeShipping: false,
      valid: true,
      message: `${pct}% discount estimated.`,
    };
  }

  if (coupon.discount_type === "flat") {
    const discountAmount = Math.min(subtotal, Math.max(0, Number(coupon.discount_value ?? 0)));
    return {
      enteredCode: code,
      normalizedCode,
      appliedCode: normalizedCode,
      discountAmount,
      freeShipping: false,
      valid: true,
      message: "Flat discount estimated.",
    };
  }

  return {
    enteredCode: code,
    normalizedCode,
    appliedCode: null,
    discountAmount: 0,
    freeShipping: false,
    valid: false,
    message: "Coupon type is not supported.",
  };
}
