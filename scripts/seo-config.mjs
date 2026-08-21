/** Shared SEO route list for sitemap generation and HTML meta injection. */

export const SITE_ORIGIN = "https://www.akmcare.in";
export const BRAND_NAME = "AKM Care";

export const STATIC_PAGES = [
  {
    path: "/",
    changefreq: "weekly",
    priority: "1.0",
    lastmod: true,
    title: "Shop Authentic Fashion Online",
    description:
      "Shop sarees, lehengas, gowns, 3-piece suits and men's jeans on AKM Care, with pan-India delivery. Industrial training, HR and compliance solutions from Ahmedabad.",
  },
  {
    path: "/about",
    changefreq: "monthly",
    priority: "0.8",
    title: "About — Mission, Services & Store",
    description:
      "AKM Care is based in Ahmedabad, Gujarat. We offer industrial training, HR and compliance services, and sell authentic fashion online across India.",
  },
  {
    path: "/services",
    changefreq: "monthly",
    priority: "0.9",
    title: "Industrial Training, HR & Compliance Services",
    description:
      "AKM Care services: industrial and corporate training, placement, manpower deployment, compliance consulting, policy formation and employment verification across India.",
  },
  {
    path: "/training",
    changefreq: "monthly",
    priority: "0.9",
    title: "Corporate Training — Soft Skills, Technical & Safety",
    description:
      "Professional training from AKM Care: soft skills, technical, behavioural, commercial, leadership, sales and safety compliance programmes, delivered pan-India.",
  },
  {
    path: "/shop",
    changefreq: "weekly",
    priority: "0.95",
    title: "Shop — Sarees, Lehengas, Gowns, Suits & Jeans",
    description:
      "Browse the AKM Care catalog: sarees, lehengas, ladies gowns, 3-piece suits and men's jeans. Live prices and stock, delivered across India.",
  },
  {
    path: "/sell-your-product",
    changefreq: "monthly",
    priority: "0.7",
    title: "Sell With Us",
    description:
      "Apply to list products on the AKM Care storefront and reach customers across India. Submit your details on the vendor form.",
  },
  {
    path: "/personal-booking",
    changefreq: "monthly",
    priority: "0.4",
    title: "Personal Booking Links",
    description:
      "Convenience links to third-party travel and shopping sites. These services are not operated by AKM Care — read the disclaimer before you use them.",
  },
  {
    path: "/media",
    changefreq: "weekly",
    priority: "0.6",
    title: "Videos & Media",
    description:
      "Watch AKM Care training and motivation videos on YouTube @akmcare1309, and follow updates on Facebook.",
  },
  {
    path: "/motivation",
    changefreq: "daily",
    priority: "0.5",
    title: "Daily Motivation",
    description: "AKM Care daily motivational quotes and archive for professionals, teams and leaders.",
  },
  {
    path: "/csr",
    changefreq: "monthly",
    priority: "0.5",
    title: "CSR — Community Training",
    description:
      "AKM Care CSR: free soft-skill and motivational training for schools, colleges, NGOs and community groups, subject to trainer availability.",
  },
  {
    path: "/careers",
    changefreq: "weekly",
    priority: "0.6",
    title: "Careers",
    description:
      "Join AKM Care in Ahmedabad. We review applications for HR, training and operations roles and keep promising candidates in our talent pool.",
  },
  {
    path: "/faq",
    changefreq: "monthly",
    priority: "0.7",
    title: "Frequently Asked Questions",
    description:
      "Answers about AKM Care shopping, shipping, returns, training programmes, services, careers and how to get in touch.",
  },
  {
    path: "/contact",
    changefreq: "monthly",
    priority: "0.8",
    title: "Contact — Ahmedabad",
    description:
      "Contact AKM Care by phone +91-84019 95486, email contact@akmcare.in, or WhatsApp. Headquartered in Ahmedabad, Gujarat, serving clients pan-India.",
  },
  {
    path: "/shipping-returns",
    changefreq: "monthly",
    priority: "0.7",
    title: "Shipping & Returns",
    description:
      "AKM Care pan-India delivery, standard and express timelines, checkout shipping charges, and the 7-day unused-product return policy.",
  },
  {
    path: "/privacy",
    changefreq: "yearly",
    priority: "0.3",
    title: "Privacy Policy",
    description:
      "How AKM Care collects and uses account, order and contact information. Contact contact@akmcare.in for privacy questions.",
  },
  {
    path: "/terms",
    changefreq: "yearly",
    priority: "0.3",
    title: "Terms of Use",
    description:
      "Terms for using the AKM Care website, store, training services and related pages. Disputes are subject to Ahmedabad, Gujarat jurisdiction.",
  },
  {
    path: "/disclaimer",
    changefreq: "yearly",
    priority: "0.3",
    title: "Disclaimer",
    description:
      "Legal disclaimer for AKM Care website content, services, product information and Ahmedabad, Gujarat jurisdiction.",
  },
];

export const CATEGORY_PAGES = [
  {
    slug: "sarees",
    title: "Sarees — Shop",
    description:
      "Shop sarees at AKM Care. See live price, stock, length and shipping details on each product page. Pan-India delivery.",
  },
  {
    slug: "ladies-gown",
    title: "Ladies Gowns — Shop",
    description:
      "Shop ladies gowns from the AKM Care catalog. Current prices, sizes where listed, and pan-India delivery shown on each product.",
  },
  {
    slug: "stitched-lehenga",
    title: "Stitched Lehengas — Shop",
    description:
      "Shop stitched lehengas at AKM Care. Product pages list price, stock, specifications and shipping from the live catalog.",
  },
  {
    slug: "unstitched-lehenga",
    title: "Unstitched Lehengas — Shop",
    description:
      "Shop unstitched lehengas at AKM Care. Check set details, price and availability on each product before you order.",
  },
  {
    slug: "3-piece-suits",
    title: "3-Piece Suits — Shop",
    description:
      "Shop 3-piece suits (salwar + dupatta) at AKM Care. Live catalog pricing, stock and specifications with pan-India delivery.",
  },
  {
    slug: "mens-jeans",
    title: "Men's Jeans — Shop",
    description:
      "Shop men's jeans at AKM Care. See current price, stock and product details on each page. Delivered across India.",
  },
];

export const FAQ_PRERENDER = [
  {
    question: "What is AKM Care?",
    answer:
      "AKM Care is an Ahmedabad, Gujarat company. It sells authentic fashion online — sarees, lehengas, ladies gowns, 3-piece suits and men's jeans — with pan-India delivery, and provides industrial training, HR and compliance services.",
  },
  {
    question: "Does AKM Care ship across India?",
    answer:
      "Yes. Orders are delivered pan-India. Standard delivery is typically 3–5 business days and express is typically 1–2 business days. A product may list its own catalog shipping window; charges and the final date are confirmed at checkout.",
  },
  {
    question: "What is the return policy for shop orders?",
    answer:
      "Unused products can be returned within 7 days in original packing. Email contact@akmcare.in or call +91-84019 95486 with your order number to start a return.",
  },
];

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_ORIGIN}${item.url}`,
    })),
  };
}

export function collectionPageJsonLd({ name, description, url, items = [] }) {
  const page = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: url.startsWith("http") ? url : `${SITE_ORIGIN}${url}`,
  };
  if (items.length) {
    page.mainEntity = {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: item.url.startsWith("http") ? item.url : `${SITE_ORIGIN}${item.url}`,
      })),
    };
  }
  return page;
}

export function faqPageJsonLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function fullTitle(title) {
  if (!title) return BRAND_NAME;
  return title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;
}

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PRODUCT_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function isPublicSitemapSlug(slug) {
  const value = String(slug || "").trim();
  if (!value) return false;
  if (value.includes("/") || value.includes("?") || value.includes("#")) return false;
  return PRODUCT_SLUG_RE.test(value);
}

/** Absolute http(s) image URLs only — skip placeholders and non-fetchable values. */
export function toSitemapImageUrl(src, origin = SITE_ORIGIN) {
  if (!src) return null;
  const value = String(src).trim();
  if (!value) return null;
  if (/^data:/i.test(value) || /placeholder\.svg/i.test(value)) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return null;
}
