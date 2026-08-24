export type PincodeCheckStatus =
  | "idle"
  | "invalid"
  | "verifying"
  | "serviceable"
  | "unavailable"
  | "error";

export type PincodeLocation = {
  area: string;
  city: string;
  state: string;
};

export type PincodeServiceabilityResult = {
  pincode: string;
  available: boolean;
  location: PincodeLocation | null;
};

type PostalOffice = {
  Name?: string;
  District?: string;
  State?: string;
  Block?: string;
  DeliveryStatus?: string;
};

type PostalApiRow = {
  Status?: string;
  PostOffice?: PostalOffice[] | null;
};

/** Strict 6-digit Indian pincode (digits only). */
export function isValidIndianPincode(pin: string): boolean {
  return /^\d{6}$/.test(pin.trim());
}

/**
 * Existing AKM Care serviceability check — local deterministic mock.
 * No courier/Shiprocket API is wired for pre-checkout serviceability.
 */
export function mockDeliveryAvailable(pin: string): boolean {
  if (!isValidIndianPincode(pin)) return false;
  const digits = pin.trim().split("").map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return sum % 3 !== 0;
}

function pickPostalOffice(offices: PostalOffice[]): PostalOffice | null {
  if (!offices.length) return null;
  const delivery = offices.find((o) => /delivery/i.test(o.DeliveryStatus ?? ""));
  return delivery ?? offices[0] ?? null;
}

/**
 * Resolve locality display names from India Post’s public pincode API.
 * Used only for UX copy — does not decide serviceability.
 */
export async function resolvePincodeLocation(
  pin: string,
  signal?: AbortSignal,
): Promise<PincodeLocation | null> {
  if (!isValidIndianPincode(pin)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin.trim()}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PostalApiRow[];
    const row = data?.[0];
    if (!row || row.Status !== "Success" || !row.PostOffice?.length) return null;
    const office = pickPostalOffice(row.PostOffice);
    if (!office) return null;
    const area = (office.Name ?? "").trim();
    const city = (office.District ?? office.Block ?? "").trim();
    const state = (office.State ?? "").trim();
    if (!area && !city && !state) return null;
    return { area: area || city, city, state };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return null;
  }
}

/**
 * Serviceability via existing mock + optional locality enrichment.
 * Lookup starts immediately; callers should enforce animation min duration.
 */
export async function checkPincodeServiceability(
  pin: string,
  signal?: AbortSignal,
): Promise<PincodeServiceabilityResult> {
  const pincode = pin.trim();
  if (!isValidIndianPincode(pincode)) {
    return { pincode, available: false, location: null };
  }

  const available = mockDeliveryAvailable(pincode);
  let location: PincodeLocation | null = null;
  try {
    location = await resolvePincodeLocation(pincode, signal);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    location = null;
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  return { pincode, available, location };
}

/** Minimum polished verification duration (ms). */
export const PINCODE_VERIFY_MIN_MS = 900;

/** Soft upper bound for the digit orbit sequence (ms). */
export const PINCODE_ANIMATION_MS = 1050;
