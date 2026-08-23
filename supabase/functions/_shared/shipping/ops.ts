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

export function validateShippingWebhookKey(
  provided: string | null | undefined,
  expected: string | null | undefined,
): { ok: true } | { ok: false; reason: "missing" | "invalid" | "not_configured" } {
  if (!expected || !String(expected).trim()) return { ok: false, reason: "not_configured" };
  if (provided == null || provided === "") return { ok: false, reason: "missing" };
  if (!timingSafeEqualString(String(provided), String(expected))) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true };
}

export function logShippingOps(
  event: string,
  meta: Record<string, string | number | boolean | null | undefined>,
): void {
  const safe: Record<string, unknown> = { event };
  for (const [k, v] of Object.entries(meta)) {
    if (/password|token|secret|authorization|api[_-]?key|bearer/i.test(k)) continue;
    if (v === undefined) continue;
    safe[k] = v;
  }
  console.log(JSON.stringify(safe));
}

export function enqueueShippingNotification(_payload: Record<string, unknown>): void {
  // No-op in this phase — hooks only.
}
