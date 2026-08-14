/**
 * Single production-safe site origin helper.
 * Prefer the current browser origin when it is an allowlisted host;
 * never fall back to localhost while serving akmcare.in.
 */

export const PRODUCTION_SITE_ORIGIN = "https://akmcare.in";

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

const PROD_ORIGINS = ["https://akmcare.in", "https://www.akmcare.in"] as const;

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "");
}

function isAllowedBrowserOrigin(origin: string): boolean {
  if ((PROD_ORIGINS as readonly string[]).includes(origin)) return true;
  if ((DEV_ORIGINS as readonly string[]).includes(origin)) return true;
  // Vercel Preview deployments
  try {
    const host = new URL(origin).hostname;
    return host.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

/** Canonical absolute origin for the running environment. */
export function getSiteOrigin(): string {
  const envOverride = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (envOverride) {
    try {
      return normalizeOrigin(new URL(envOverride).origin);
    } catch {
      /* ignore invalid override */
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = normalizeOrigin(window.location.origin);
    if (isAllowedBrowserOrigin(origin)) return origin;
    // Production hostname that somehow wasn't listed — still prefer live origin over localhost
    if (origin.includes("akmcare.in")) return origin;
  }

  if (import.meta.env.DEV) return DEV_ORIGINS[0];
  return PRODUCTION_SITE_ORIGIN;
}

/** Absolute URL for auth redirects (signup verify, OAuth, password reset). */
export function getAuthRedirectUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
}

/** Origins allowed by Edge Function CORS (keep localhost for local DEV only). */
export const EDGE_ALLOWED_ORIGINS = [...DEV_ORIGINS, ...PROD_ORIGINS] as const;
