import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __akmGa4ScriptLoaded?: boolean;
    __akmGa4Configured?: boolean;
  }
}

const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "code",
  "access_token",
  "refresh_token",
  "id_token",
  "email",
  "phone",
  "password",
  "signature",
  "order",
  "razorpay_payment_id",
  "razorpay_order_id",
  "razorpay_signature",
  "payment_id",
  "client_secret",
  "api_key",
  "key",
]);

const PATHNAME_ONLY_PREFIXES = ["/order-success", "/auth/callback", "/auth/reset-password"];

const SHOP_SAFE_QUERY_KEYS = new Set(["category", "collection", "sort"]);

function readEnvFlag(name: keyof ImportMetaEnv, fallback = false): boolean {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === "") return fallback;
  return String(raw).toLowerCase() === "true";
}

export function getGa4MeasurementId(): string {
  return String(import.meta.env.VITE_GA4_MEASUREMENT_ID || "").trim();
}

export function isGa4Enabled(): boolean {
  return readEnvFlag("VITE_GA4_ENABLED", false) && Boolean(getGa4MeasurementId());
}

export function isGa4DebugMode(): boolean {
  return readEnvFlag("VITE_GA4_DEBUG", false);
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Strip sensitive query strings before sending page_path to GA4. */
export function sanitizePagePath(pathname: string, search = ""): string {
  const path = pathname || "/";

  if (PATHNAME_ONLY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return path;
  }

  if (!search || search === "?") return path;

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const safe = new URLSearchParams();

  if (path === "/shop" || path.startsWith("/shop/")) {
    for (const [key, value] of params.entries()) {
      const lower = key.toLowerCase();
      if (!SHOP_SAFE_QUERY_KEYS.has(lower)) continue;
      if (SENSITIVE_QUERY_KEYS.has(lower)) continue;
      if (value.trim()) safe.set(key, value.trim());
    }
  }

  const qs = safe.toString();
  return qs ? `${path}?${qs}` : path;
}

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LIKE = /^(\+?\d[\d\s-]{7,}\d)$/;

/** Returns true when a search term should not be sent to analytics. */
export function isSensitiveSearchTerm(term: string): boolean {
  const t = term.trim();
  if (!t) return true;
  if (EMAIL_LIKE.test(t)) return true;
  const digits = t.replace(/\D/g, "");
  if (digits.length >= 10 && PHONE_LIKE.test(t.replace(/\s/g, ""))) return true;
  const lower = t.toLowerCase();
  if (SENSITIVE_QUERY_KEYS.has(lower)) return true;
  if (/token|password|secret|signature|access_token/i.test(t)) return true;
  return false;
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
}

export function ensureGa4Initialized(): boolean {
  if (!isGa4Enabled()) return false;
  if (typeof window === "undefined") return false;

  ensureDataLayer();

  const measurementId = getGa4MeasurementId();

  if (!window.__akmGa4ScriptLoaded) {
    window.__akmGa4ScriptLoaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  if (!window.__akmGa4Configured) {
    window.__akmGa4Configured = true;
    window.gtag?.("js", new Date());
    window.gtag?.("config", measurementId, {
      send_page_view: false,
      ...(isGa4DebugMode() ? { debug_mode: true } : {}),
    });
  }

  return true;
}

export function ga4Event(eventName: string, params?: Record<string, unknown>): boolean {
  if (!isGa4Enabled() || typeof window === "undefined") return false;
  if (isAdminPath(window.location.pathname)) return false;
  if (!ensureGa4Initialized()) return false;

  const payload: Record<string, unknown> = { ...params };
  if (isGa4DebugMode()) payload.debug_mode = true;

  window.gtag?.("event", eventName, payload);
  return true;
}

export function trackPageView(params: { page_path: string; page_title?: string }): void {
  ga4Event("page_view", {
    page_path: params.page_path,
    page_title: params.page_title || document.title || "",
  });
}

/** Central SPA route listener — fires one page_view per meaningful route change. */
export function Ga4RouteTracker() {
  const { pathname, search } = useLocation();
  const lastSentRef = useRef("");

  useEffect(() => {
    if (isAdminPath(pathname)) return;
    ensureGa4Initialized();
  }, [pathname]);

  useEffect(() => {
    if (isAdminPath(pathname)) return;

    const pagePath = sanitizePagePath(pathname, search);
    const signature = `${pagePath}|${document.title || ""}`;
    if (signature === lastSentRef.current) return;
    lastSentRef.current = signature;

    trackPageView({
      page_path: pagePath,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
}
