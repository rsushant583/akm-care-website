/**
 * Safe catalog / merchandising business rules stored in site_settings.
 * Defaults match current storefront constants — do not invent new business values.
 */

import { LOW_STOCK_THRESHOLD } from "@/lib/ecommerce/badges";
import { getAllSettings, saveSetting } from "@/services/adminCmsService";

export type CatalogBusinessSettings = {
  /** Inventory at or below this count is "low stock" (storefront badge uses 5 today). */
  low_stock_threshold: number;
  /** Discount % at or above this qualifies for Deals when discount_percent is set. */
  deal_threshold_percent: number;
  /** Days since publish/create to suggest New Arrival. */
  new_arrival_days: number;
  /** Optional WhatsApp number for support (digits / + allowed). Empty = not configured. */
  whatsapp: string;
  /** Business hours free text — empty means not configured. */
  business_hours: string;
};

/** Defaults preserve existing platform behavior. */
export const DEFAULT_CATALOG_SETTINGS: CatalogBusinessSettings = {
  low_stock_threshold: LOW_STOCK_THRESHOLD,
  deal_threshold_percent: 1,
  new_arrival_days: 30,
  whatsapp: "",
  business_hours: "",
};

export function normalizeCatalogSettings(raw: unknown): CatalogBusinessSettings {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    low_stock_threshold: num(r.low_stock_threshold, DEFAULT_CATALOG_SETTINGS.low_stock_threshold),
    deal_threshold_percent: num(r.deal_threshold_percent, DEFAULT_CATALOG_SETTINGS.deal_threshold_percent),
    new_arrival_days: num(r.new_arrival_days, DEFAULT_CATALOG_SETTINGS.new_arrival_days),
    whatsapp: typeof r.whatsapp === "string" ? r.whatsapp.trim() : "",
    business_hours: typeof r.business_hours === "string" ? r.business_hours.trim() : "",
  };
}

export async function loadCatalogSettings(): Promise<CatalogBusinessSettings> {
  try {
    const all = await getAllSettings();
    return normalizeCatalogSettings(all.catalog);
  } catch {
    return { ...DEFAULT_CATALOG_SETTINGS };
  }
}

export async function saveCatalogSettings(settings: CatalogBusinessSettings): Promise<void> {
  await saveSetting("catalog", {
    low_stock_threshold: settings.low_stock_threshold,
    deal_threshold_percent: settings.deal_threshold_percent,
    new_arrival_days: settings.new_arrival_days,
    whatsapp: settings.whatsapp,
    business_hours: settings.business_hours,
  });
}

export function isWithinNewArrivalWindow(createdAt: string | null | undefined, days: number): boolean {
  if (!createdAt || !Number.isFinite(days) || days <= 0) return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  const ms = days * 24 * 60 * 60 * 1000;
  return Date.now() - created <= ms;
}
