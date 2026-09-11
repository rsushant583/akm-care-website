/** Explicit parcel profile — never invent defaults; never use saree length as package dims. */

export type ParcelProfile = {
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
};

export const PARCEL_PROFILE_SETTINGS_KEY = "parcel_profile";

export const PACKAGE_REQUIRED_MESSAGE =
  "Package weight and dimensions are required before shipping can be created.";

export type ParcelProfileRaw = {
  weight_kg?: unknown;
  length_cm?: unknown;
  breadth_cm?: unknown;
  height_cm?: unknown;
};

function positiveNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function firstPositive(raw: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const n = positiveNumber(raw[key]);
    if (n != null) return n;
  }
  return null;
}

export function parseParcelProfile(raw: unknown): ParcelProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const weightKg = firstPositive(o, ["weight_kg", "weightKg"]);
  const lengthCm = firstPositive(o, ["length_cm", "lengthCm"]);
  const breadthCm = firstPositive(o, ["breadth_cm", "breadthCm"]);
  const heightCm = firstPositive(o, ["height_cm", "heightCm"]);
  if (weightKg == null || lengthCm == null || breadthCm == null || heightCm == null) return null;
  return { weightKg, lengthCm, breadthCm, heightCm };
}

/** Create-shipment guard: explicit packed parcel only. Never invents or falls back. */
export function requirePackedParcel(raw: unknown): ParcelProfile {
  const packed = parseParcelProfile(raw);
  if (!packed) throw new Error(PACKAGE_REQUIRED_MESSAGE);
  return packed;
}

export function packedParcelValidationMessage(raw: unknown): string | null {
  return parseParcelProfile(raw) ? null : PACKAGE_REQUIRED_MESSAGE;
}

export type ProductParcelOverride = {
  package_weight_kg?: unknown;
  package_length_cm?: unknown;
  package_breadth_cm?: unknown;
  package_height_cm?: unknown;
};

/**
 * Precedence: explicit packed parcel (this shipment)
 *   > complete per-product override (single-SKU path)
 *   > store default parcel_profile
 * Never mix catalog weight/dimensions text.
 */
export function resolveParcelProfile(opts: {
  packedParcel?: unknown;
  storeDefault: unknown;
  productOverride?: ProductParcelOverride | null;
}): { ok: true; profile: ParcelProfile } | { ok: false; message: string } {
  const fromPacked = opts.packedParcel !== undefined && opts.packedParcel !== null
    ? parseParcelProfile(opts.packedParcel)
    : null;
  if (fromPacked) return { ok: true, profile: fromPacked };

  const fromProduct = opts.productOverride
    ? parseParcelProfile({
        weight_kg: opts.productOverride.package_weight_kg,
        length_cm: opts.productOverride.package_length_cm,
        breadth_cm: opts.productOverride.package_breadth_cm,
        height_cm: opts.productOverride.package_height_cm,
      })
    : null;
  if (fromProduct) return { ok: true, profile: fromProduct };

  const fromStore = parseParcelProfile(opts.storeDefault);
  if (fromStore) return { ok: true, profile: fromStore };

  return { ok: false, message: PACKAGE_REQUIRED_MESSAGE };
}

export function parcelProfileToSettingsValue(profile: ParcelProfile): ParcelProfileRaw {
  return {
    weight_kg: profile.weightKg,
    length_cm: profile.lengthCm,
    breadth_cm: profile.breadthCm,
    height_cm: profile.heightCm,
  };
}

export type PackedParcelForm = {
  weight_kg: string;
  length_cm: string;
  breadth_cm: string;
  height_cm: string;
};

export const EMPTY_PACKED_PARCEL_FORM: PackedParcelForm = {
  weight_kg: "",
  length_cm: "",
  breadth_cm: "",
  height_cm: "",
};

export function parcelProfileToForm(profile: ParcelProfile): PackedParcelForm {
  return {
    weight_kg: String(profile.weightKg),
    length_cm: String(profile.lengthCm),
    breadth_cm: String(profile.breadthCm),
    height_cm: String(profile.heightCm),
  };
}

export function buildCreateShipmentRequest(orderId: string, parcel: ParcelProfile) {
  return {
    action: "create" as const,
    orderId,
    parcel: parcelProfileToSettingsValue(parcel),
  };
}
