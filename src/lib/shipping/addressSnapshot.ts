/** Immutable order destination snapshot helpers. Never invent address fields. */

export type ShippingDestinationSnapshot = {
  recipientName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function pick(obj: Record<string, unknown> | null | undefined, keys: string[]): string {
  if (!obj) return "";
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

/**
 * Build destination from order_headers fields + shipping_address jsonb.
 * Saved addresses table is NOT used — historical order snapshot only.
 */
export function buildDestinationSnapshot(input: {
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: Record<string, unknown> | null;
}): ShippingDestinationSnapshot {
  const addr = input.shippingAddress || {};
  return {
    recipientName: pick(addr, ["fullName", "full_name", "name"]) || String(input.customerName || "").trim(),
    phone: pick(addr, ["phone", "mobile"]) || String(input.customerPhone || "").trim(),
    email: String(input.customerEmail || "").trim(),
    addressLine1: pick(addr, ["area", "line1", "address_line1", "street", "address"]),
    addressLine2: pick(addr, ["landmark", "line2", "address_line2"]),
    city: pick(addr, ["city"]),
    state: pick(addr, ["state"]),
    postalCode: pick(addr, ["pincode", "pin", "postal_code", "zip"]),
    country: pick(addr, ["country"]) || "India",
  };
}

export type DestinationValidation =
  | { ok: true; snapshot: ShippingDestinationSnapshot }
  | { ok: false; missing: string[] };

export function validateDestinationSnapshot(
  snapshot: ShippingDestinationSnapshot,
): DestinationValidation {
  const missing: string[] = [];
  if (!snapshot.recipientName || snapshot.recipientName.length < 2) missing.push("recipient name");
  if (!snapshot.phone || snapshot.phone.replace(/\D/g, "").length < 10) missing.push("phone");
  if (!snapshot.addressLine1) missing.push("address line 1");
  if (!snapshot.city) missing.push("city");
  if (!snapshot.state) missing.push("state");
  if (!snapshot.postalCode || !/^\d{6}$/.test(snapshot.postalCode.replace(/\s/g, ""))) {
    missing.push("postal code");
  }
  if (!snapshot.country) missing.push("country");
  if (missing.length) return { ok: false, missing };
  return { ok: true, snapshot };
}
