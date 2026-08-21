import { BRAND, BRAND_SAME_AS } from "@/lib/config/brand";
import { absoluteSiteUrl, getCanonicalSiteOrigin } from "@/lib/config/siteUrl";

const siteOrigin = getCanonicalSiteOrigin();

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteOrigin}/#organization`,
  name: BRAND.name,
  legalName: BRAND.legalName,
  url: siteOrigin,
  logo: {
    "@type": "ImageObject",
    url: absoluteSiteUrl(BRAND.logoPath),
  },
  image: absoluteSiteUrl(BRAND.defaultShareImagePath),
  description: BRAND.description,
  email: BRAND.email,
  telephone: BRAND.phoneDisplay,
  address: {
    "@type": "PostalAddress",
    addressLocality: BRAND.locality,
    addressRegion: BRAND.region,
    addressCountry: BRAND.country,
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: BRAND.phoneDisplay,
      email: BRAND.email,
      availableLanguage: [...BRAND.languages],
      areaServed: BRAND.areaServed,
    },
  ],
  sameAs: [...BRAND_SAME_AS],
  areaServed: {
    "@type": "Country",
    name: BRAND.countryName,
  },
  foundingLocation: BRAND.foundingLocation,
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteOrigin}/#website`,
  name: BRAND.name,
  url: siteOrigin,
  description: BRAND.description,
  inLanguage: "en-IN",
  publisher: { "@id": `${siteOrigin}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteOrigin}/shop?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Industrial Training & HR Solutions",
  provider: {
    "@id": `${siteOrigin}/#organization`,
    "@type": "Organization",
    name: BRAND.name,
  },
  areaServed: {
    "@type": "Country",
    name: BRAND.countryName,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "AKM Care Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Industrial Training" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Placement Services" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Manpower Deployment" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Compliance Consulting" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Policy Formation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Employment Verification" } },
    ],
  },
};

export const faqSchema = (faqs: { question: string; answer: string }[]) => {
  const items = faqs.filter((f) => f.question?.trim() && f.answer?.trim());
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.trim(),
      },
    })),
  };
};

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: absoluteSiteUrl(item.url),
  })),
});

export function collectionPageSchema(input: {
  name: string;
  description?: string;
  url: string;
  items: { name: string; url: string }[];
  numberOfItems?: number;
}) {
  if (!input.items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteSiteUrl(input.url),
    isPartOf: { "@id": `${siteOrigin}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.numberOfItems ?? input.items.length,
      itemListElement: input.items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: absoluteSiteUrl(item.url),
      })),
    },
  };
}
