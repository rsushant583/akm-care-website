/** Timing-safe webhook token comparison (Shiprocket x-api-key). */

export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const max = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < max; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= ca ^ cb;
  }
  return mismatch === 0;
}

export type WebhookAuthResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "not_configured" };

export function validateShippingWebhookKey(
  provided: string | null | undefined,
  expected: string | null | undefined,
): WebhookAuthResult {
  if (!expected || !String(expected).trim()) {
    return { ok: false, reason: "not_configured" };
  }
  if (provided == null || provided === "") {
    return { ok: false, reason: "missing" };
  }
  if (!timingSafeEqualString(String(provided), String(expected))) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true };
}
