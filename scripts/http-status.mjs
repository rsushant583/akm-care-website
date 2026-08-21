/**
 * Shared HTTP-status helpers for Vercel Edge middleware and unit tests.
 * Keep this file Edge-safe: no Node fs, path, or process-only APIs.
 * Path lists here are mirrored (import-free) in /middleware.js — update both.
 */

import { STATIC_PAGES } from "./seo-config.mjs";

export const PUBLIC_PATHS = new Set(STATIC_PAGES.map((page) => page.path));

export const SPA_PREFIXES = [
  "/cart",
  "/checkout",
  "/wishlist",
  "/auth",
  "/account",
  "/admin",
  "/order-success",
];

export const PRODUCT_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  const trimmed = String(pathname).replace(/\/+$/, "");
  return trimmed || "/";
}

export function isAssetPath(pathname) {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function isSpaRoute(pathname) {
  const p = normalizePathname(pathname);
  return SPA_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export function isPublicStaticPath(pathname) {
  return PUBLIC_PATHS.has(normalizePathname(pathname));
}

export function parseProductSlug(pathname) {
  const p = normalizePathname(pathname);
  const match = p.match(/^\/shop\/product\/([^/]+)$/);
  return match ? match[1] : null;
}

export function isPublicProductSlug(slug) {
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

export function isKnownAppPath(pathname) {
  const p = normalizePathname(pathname);
  if (isAssetPath(p)) return true;
  if (isPublicStaticPath(p) || isSpaRoute(p)) return true;
  if (p === "/shop/product" || p.startsWith("/shop/product/")) return true;
  return false;
}
