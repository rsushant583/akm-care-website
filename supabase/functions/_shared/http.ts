export function allowedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") || "";
  const configured = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    "https://akmcare.in",
    "https://www.akmcare.in",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
  ];
  const allow = configured.length ? configured : defaults;
  if (origin && allow.includes(origin)) return origin;
  // Never default ACAO to localhost — that confuses CORS debugging on production.
  // Echoing a non-allowed origin is unsafe; use first production origin as inert fallback.
  const prod = allow.find((o) => o.startsWith("https://akmcare.in")) || "https://akmcare.in";
  return prod;
}

export function corsHeadersFor(req: Request) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-api-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

export function publicError(e: unknown, fallback: string) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/stock|price|coupon|cart|customer|invalid|required|empty|signature|amount|not found/i.test(msg)) {
    return msg;
  }
  return fallback;
}
