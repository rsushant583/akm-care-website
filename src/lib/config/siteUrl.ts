/**
 * Single production-safe site origin helper.
 * Prefer the current browser origin when it is an allowlisted host;
 * never fall back to localhost while serving akmcare.in.
 */

/** Canonical production origin (www). Apex akmcare.in redirects here on Vercel. */
export const PRODUCTION_SITE_ORIGIN = "https://www.akmcare.in";

/** @deprecated Prefer PRODUCTION_SITE_ORIGIN or getCanonicalSiteOrigin(). */
export const CANONICAL_SITE_ORIGIN = PRODUCTION_SITE_ORIGIN;

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

const PROD_ORIGINS = [PRODUCTION_SITE_ORIGIN, "https://akmcare.in"] as const;

function normalizeProductionOrigin(origin: string): string {
  try {
    const host = new URL(origin).hostname.replace(/^www\./, "");
    if (host === "akmcare.in") return PRODUCTION_SITE_ORIGIN;
  } catch {
    /* ignore */
  }
  return origin;
}

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

/** Canonical absolute origin for SEO, sitemap, JSON-LD, and share fallbacks. */
export function getCanonicalSiteOrigin(): string {
  const envOverride = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (envOverride) {
    try {
      return normalizeProductionOrigin(normalizeOrigin(new URL(envOverride).origin));
    } catch {
      /* ignore invalid override */
    }
  }

  if (import.meta.env.DEV) return DEV_ORIGINS[0];
  return PRODUCTION_SITE_ORIGIN;
}

/** Canonical absolute origin for the running environment. */
export function getSiteOrigin(): string {
  const envOverride = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (envOverride) {
    try {
      return normalizeProductionOrigin(normalizeOrigin(new URL(envOverride).origin));
    } catch {
      /* ignore invalid override */
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = normalizeOrigin(window.location.origin);
    if (isAllowedBrowserOrigin(origin)) return normalizeProductionOrigin(origin);
  }

  if (import.meta.env.DEV) return DEV_ORIGINS[0];
  return PRODUCTION_SITE_ORIGIN;
}

/** Build an absolute URL on the canonical site origin. */
export function absoluteSiteUrl(path = ""): string {
  const origin = getCanonicalSiteOrigin();
  if (!path) return origin;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

/** Absolute URL for auth redirects (signup verify, OAuth, password reset). */
export function getAuthRedirectUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
}

/** Origins allowed by Edge Function CORS (keep localhost for local DEV only). */
export const EDGE_ALLOWED_ORIGINS = [...DEV_ORIGINS, ...PROD_ORIGINS] as const;
