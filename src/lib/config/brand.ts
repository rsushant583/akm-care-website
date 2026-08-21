/**
 * Canonical brand / entity facts used by metadata, JSON-LD, footer, and GEO pages.
 * Only information already published on the storefront belongs here — do not invent fields.
 */

export const BRAND = {
  name: "AKM Care",
  legalName: "AKM Care",
  tagline: "Authentic fashion and industrial solutions, pan-India.",
  description:
    "AKM Care sells authentic fashion online — sarees, lehengas, gowns, 3-piece suits and men's jeans — and provides industrial training, HR, and compliance services from Ahmedabad, Gujarat.",
  email: "contact@akmcare.in",
  phoneDisplay: "+91-84019 95486",
  phoneE164: "+918401995486",
  whatsappUrl: "https://wa.me/918401995486",
  locality: "Ahmedabad",
  region: "Gujarat",
  country: "IN",
  countryName: "India",
  addressDisplay: "Ahmedabad, Gujarat, India",
  foundingLocation: "Ahmedabad, Gujarat, India",
  areaServed: "IN",
  languages: ["English", "Hindi"] as const,
  social: {
    youtube: "https://www.youtube.com/@akmcare1309",
    facebook: "https://www.facebook.com/share/1Jjs7ipP1x/",
  },
  logoPath: "/logo.jpeg",
    defaultShareImagePath: "/og-image.jpg",
} as const;

export const BRAND_SAME_AS = [BRAND.social.youtube, BRAND.social.facebook] as const;
