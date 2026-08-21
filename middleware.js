/**
 * Production HTTP status for the Vite SPA.
 *
 * Keep this file Edge-safe and import-free. Vercel Edge bundling of local
 * `.mjs` helpers has failed silently on some Vite deploys; inlining the
 * allowlist avoids that. Keep paths in sync with scripts/seo-config.mjs.
 *
 * Catch-all rewrite still sends unknown files to index.html (client routing).
 * This middleware returns HTTP 404 for unknown paths and missing product slugs.
 *
 * Supabase product lookup:
 * - Valid slug + row exists → continue (200, prerendered HTML if present)
 * - Valid slug + row missing → 404
 * - Env missing or Supabase error → fail-open (continue 200). The storefront
 *   stays up; the client empty/404 UI still noindexes. Set VITE_SUPABASE_URL
 *   and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY) as
 *   Vercel *runtime* env so invalid products can 404.
 */

const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/services",
  "/training",
  "/shop",
  "/sell-your-product",
  "/personal-booking",
  "/media",
  "/motivation",
  "/csr",
  "/careers",
  "/faq",
  "/guides",
  "/guides/saree-length",
  "/contact",
  "/shipping-returns",
  "/privacy",
  "/terms",
  "/disclaimer",
]);

const SPA_PREFIXES = [
  "/cart",
  "/checkout",
  "/wishlist",
  "/auth",
  "/account",
  "/admin",
  "/order-success",
];

const OFFICIAL_CATEGORIES = new Set([
  "sarees",
  "ladies-gown",
  "stitched-lehenga",
  "unstitched-lehenga",
  "3-piece-suits",
  "mens-jeans",
]);

const PRODUCT_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export const config = {
  matcher: ["/((?!.*\\.[a-zA-Z0-9]+$).*)"],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (/\.[a-zA-Z0-9]+$/.test(pathname) || pathname === "/404.html") {
    return;
  }

  const productSlug = parseProductSlug(pathname);
  if (productSlug != null) {
    if (!isPublicProductSlug(productSlug)) {
      return notFound(request);
    }
    const exists = await productExists(productSlug);
    if (exists === false) return notFound(request);
    return;
  }

  if (pathname.startsWith("/shop/product/")) {
    return notFound(request);
  }

  if (normalizePathname(pathname) === "/shop") {
    const categoryHtml = await serveOfficialCategoryHtml(request, url);
    if (categoryHtml) return categoryHtml;
    return;
  }

  if (isKnownAppPath(pathname)) {
    return;
  }

  return notFound(request);
}

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function parseProductSlug(pathname) {
  const match = normalizePathname(pathname).match(/^\/shop\/product\/([^/]+)$/);
  return match ? match[1] : null;
}

function isPublicProductSlug(slug) {
  if (!slug) return false;
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return false;
  }
  if (decoded.includes("/") || decoded.includes("?") || decoded.includes("#")) return false;
  return PRODUCT_SLUG_RE.test(decoded);
}

function isKnownAppPath(pathname) {
  const p = normalizePathname(pathname);
  if (PUBLIC_PATHS.has(p)) return true;
  return SPA_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

async function serveOfficialCategoryHtml(request, url) {
  const category = url.searchParams.get("category");
  if (!category || !OFFICIAL_CATEGORIES.has(category)) return null;
  const query = (
    url.searchParams.get("q") ||
    url.searchParams.get("query") ||
    url.searchParams.get("search") ||
    ""
  ).trim();
  if (query) return null;
  for (const key of url.searchParams.keys()) {
    if (key !== "category") return null;
  }
  try {
    const seoUrl = new URL(`/seo-category/${encodeURIComponent(category)}/index.html`, request.url);
    const response = await fetch(seoUrl);
    if (!response.ok) return null;
    const body = await response.text();
    if (!body || !/<title>/i.test(body)) return null;
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return null;
  }
}

async function productExists(slug) {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(
    /\/$/,
    "",
  );
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !key) return null;

  const endpoint = `${supabaseUrl}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&status=not.in.(draft,archived)&select=slug&limit=1`;
  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;
    const rows = await response.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return null;
  }
}

async function notFound(request) {
  try {
    const response = await fetch(new URL("/404.html", request.url));
    const body = await response.text();
    return new Response(body, {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex, nofollow",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="robots" content="noindex, nofollow"/><title>Page Not Found | AKM Care</title></head><body><h1>404</h1><p>This page is not available.</p><p><a href="/">Home</a> · <a href="/shop">Shop</a></p></body></html>`,
      {
        status: 404,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-robots-tag": "noindex, nofollow",
          "cache-control": "no-store",
        },
      },
    );
  }
}
