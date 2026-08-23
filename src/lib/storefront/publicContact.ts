/**
 * Public storefront contact / support details from site_settings.
 * Falls back to business-approved constants when unset or load fails.
 * Public read of site_settings is allowed (anon SELECT); never writes.
 */

import { getSupabaseClient } from "@/lib/supabaseClient";
import { normalizeCatalogSettings } from "@/lib/admin/catalogSettings";

/** Existing business-approved fallbacks (Footer / Contact today). */
export const FALLBACK_PUBLIC_CONTACT = {
  phoneDisplay: "+91-84019 95486",
  phoneTel: "+918401995486",
  email: "contact@akmcare.in",
  whatsappDisplay: "+91-84019 95486",
  whatsappWaMe: "918401995486",
  address: "Ahmedabad, Gujarat, India",
  businessHours: "",
} as const;

export type PublicContactInfo = {
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  whatsappDisplay: string;
  /** Digits only for wa.me links */
  whatsappWaMe: string;
  whatsappHref: string;
  address: string;
  businessHours: string;
  /** True when at least one site_settings value overrode a fallback. */
  fromSettings: boolean;
};

function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

function formatPhoneDisplay(raw: string): string {
  const t = raw.trim();
  if (!t) return FALLBACK_PUBLIC_CONTACT.phoneDisplay;
  return t;
}

function toTelHref(raw: string): string {
  const d = digitsOnly(raw);
  if (!d) return FALLBACK_PUBLIC_CONTACT.phoneTel;
  return d.startsWith("91") || d.startsWith("+") ? `+${d.replace(/^\+/, "")}` : `+${d}`;
}

function toWaMe(raw: string): string {
  let d = digitsOnly(raw);
  if (!d) return FALLBACK_PUBLIC_CONTACT.whatsappWaMe;
  // Indian mobile without country code
  if (d.length === 10) d = `91${d}`;
  return d;
}

function firstString(list: unknown): string {
  if (Array.isArray(list)) {
    const hit = list.map((x) => String(x || "").trim()).find(Boolean);
    return hit || "";
  }
  if (typeof list === "string") return list.trim();
  return "";
}

export function buildPublicContact(raw: {
  contact?: unknown;
  catalog?: unknown;
}): PublicContactInfo {
  const contact =
    raw.contact && typeof raw.contact === "object" && !Array.isArray(raw.contact)
      ? (raw.contact as Record<string, unknown>)
      : {};
  const catalog = normalizeCatalogSettings(raw.catalog);

  const phoneFromSettings = firstString(contact.phones);
  const emailFromSettings = firstString(contact.emails);
  const addressFromSettings =
    typeof contact.address === "string" ? contact.address.trim() : "";
  const whatsappFromSettings = catalog.whatsapp || phoneFromSettings;
  const hoursFromSettings = catalog.business_hours;

  const phoneDisplay = phoneFromSettings
    ? formatPhoneDisplay(phoneFromSettings)
    : FALLBACK_PUBLIC_CONTACT.phoneDisplay;
  const phoneTel = phoneFromSettings ? toTelHref(phoneFromSettings) : FALLBACK_PUBLIC_CONTACT.phoneTel;
  const email = emailFromSettings || FALLBACK_PUBLIC_CONTACT.email;
  const address = addressFromSettings || FALLBACK_PUBLIC_CONTACT.address;
  const whatsappDisplay = whatsappFromSettings
    ? formatPhoneDisplay(whatsappFromSettings)
    : FALLBACK_PUBLIC_CONTACT.whatsappDisplay;
  const whatsappWaMe = whatsappFromSettings
    ? toWaMe(whatsappFromSettings)
    : FALLBACK_PUBLIC_CONTACT.whatsappWaMe;

  const fromSettings = Boolean(
    phoneFromSettings ||
      emailFromSettings ||
      addressFromSettings ||
      catalog.whatsapp ||
      catalog.business_hours,
  );

  return {
    phoneDisplay,
    phoneTel,
    email,
    whatsappDisplay,
    whatsappWaMe,
    whatsappHref: `https://wa.me/${whatsappWaMe}`,
    address,
    businessHours: hoursFromSettings || FALLBACK_PUBLIC_CONTACT.businessHours,
    fromSettings,
  };
}

export async function loadPublicContact(): Promise<PublicContactInfo> {
  const fallback = buildPublicContact({});
  try {
    const client = getSupabaseClient();
    if (!client) return fallback;
    const { data, error } = await client
      .from("site_settings")
      .select("key, value")
      .in("key", ["contact", "catalog"]);
    if (error) return fallback;
    const map: Record<string, unknown> = {};
    for (const row of data || []) {
      if (row?.key) map[String(row.key)] = row.value;
    }
    return buildPublicContact({ contact: map.contact, catalog: map.catalog });
  } catch {
    return fallback;
  }
}
