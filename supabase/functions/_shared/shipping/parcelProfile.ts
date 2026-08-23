export type ParcelProfile = {
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
};

export const PACKAGE_REQUIRED_MESSAGE =
  "Package weight and dimensions are required before shipping can be created.";

function positiveNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function parseParcelProfile(raw: unknown): ParcelProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const weightKg = positiveNumber(o.weight_kg);
  const lengthCm = positiveNumber(o.length_cm);
  const breadthCm = positiveNumber(o.breadth_cm);
  const heightCm = positiveNumber(o.height_cm);
  if (weightKg == null || lengthCm == null || breadthCm == null || heightCm == null) return null;
  return { weightKg, lengthCm, breadthCm, heightCm };
}

export function resolveParcelProfile(opts: {
  storeDefault: unknown;
  productOverride?: Record<string, unknown> | null;
}): { ok: true; profile: ParcelProfile } | { ok: false; message: string } {
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
