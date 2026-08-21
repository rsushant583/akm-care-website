import { BRAND } from "@/lib/config/brand";

export type SeoPageMeta = {
  title: string;
  description: string;
  path: string;
  indexable?: boolean;
  intro?: string;
};

export const DEFAULT_OG_IMAGE_PATH = BRAND.defaultShareImagePath;

export const HOME_SEO: SeoPageMeta = {
  path: "/",
  title: "Shop Authentic Fashion Online",
  description:
    "Shop sarees, lehengas, gowns, 3-piece suits and men's jeans on AKM Care, with pan-India delivery. Industrial training, HR and compliance solutions from Ahmedabad.",
};

export const SHOP_SEO: SeoPageMeta = {
  path: "/shop",
  title: "Shop — Sarees, Lehengas, Gowns, Suits & Jeans",
  description:
    "Browse the AKM Care catalog: sarees, lehengas, ladies gowns, 3-piece suits and men's jeans. Live prices and stock, delivered across India.",
  intro:
    "The AKM Care shop lists sarees, lehengas, ladies gowns, 3-piece suits and men's jeans. Prices and stock come from the live catalog. Delivery is pan-India; shipping charges and the final date are confirmed at checkout.",
};

export const CATEGORY_SEO: Record<string, { title: string; description: string; intro: string }> = {
  sarees: {
    title: "Sarees — Shop",
    description:
      "Shop sarees at AKM Care. See live price, stock, length and shipping details on each product page. Pan-India delivery.",
    intro:
      "Sarees currently listed on AKM Care. Open a product for live price, stock, length or colour options when those fields exist in the catalog. Orders ship pan-India.",
  },
  "ladies-gown": {
    title: "Ladies Gowns — Shop",
    description:
      "Shop ladies gowns from the AKM Care catalog. Current prices, sizes where listed, and pan-India delivery shown on each product.",
    intro:
      "Ladies gowns from the live AKM Care catalog. Check colour or size options, price and stock on each product before ordering.",
  },
  "stitched-lehenga": {
    title: "Stitched Lehengas — Shop",
    description:
      "Shop stitched lehengas at AKM Care. Product pages list price, stock, specifications and shipping from the live catalog.",
    intro:
      "Stitched lehengas listed by AKM Care. Product pages show the catalog price, stock and any size or set details that have been entered.",
  },
  "unstitched-lehenga": {
    title: "Unstitched Lehengas — Shop",
    description:
      "Shop unstitched lehengas at AKM Care. Check set details, price and availability on each product before you order.",
    intro:
      "Unstitched lehengas from the AKM Care catalog. Confirm set contents, price and stock on the product page — we do not invent fabric or origin claims here.",
  },
  "3-piece-suits": {
    title: "3-Piece Suits — Shop",
    description:
      "Shop 3-piece suits (salwar + dupatta) at AKM Care. Live catalog pricing, stock and specifications with pan-India delivery.",
    intro:
      "3-piece suits (salwar + dupatta) currently in the AKM Care catalog. Each product page lists live price, stock and any size or colour options on file.",
  },
  "mens-jeans": {
    title: "Men's Jeans — Shop",
    description:
      "Shop men's jeans at AKM Care. See current price, stock and product details on each page. Delivered across India.",
    intro:
      "Men's jeans listed on AKM Care. Check the product page for current price, stock and any size or colour options in the catalog.",
  },
};

export const PAGE_SEO: Record<string, SeoPageMeta> = {
  "/": HOME_SEO,
  "/shop": SHOP_SEO,
  "/about": {
    path: "/about",
    title: "About — Mission, Services & Store",
    description:
      "AKM Care is based in Ahmedabad, Gujarat. We offer industrial training, HR and compliance services, and sell authentic fashion online across India.",
  },
  "/services": {
    path: "/services",
    title: "Industrial Training, HR & Compliance Services",
    description:
      "AKM Care services: industrial and corporate training, placement, manpower deployment, compliance consulting, policy formation and employment verification across India.",
  },
  "/training": {
    path: "/training",
    title: "Corporate Training — Soft Skills, Technical & Safety",
    description:
      "Professional training from AKM Care: soft skills, technical, behavioural, commercial, leadership, sales and safety compliance programmes, delivered pan-India.",
  },
  "/contact": {
    path: "/contact",
    title: "Contact — Ahmedabad",
    description:
      "Contact AKM Care by phone +91-84019 95486, email contact@akmcare.in, or WhatsApp. Headquartered in Ahmedabad, Gujarat, serving clients pan-India.",
  },
  "/faq": {
    path: "/faq",
    title: "Frequently Asked Questions",
    description:
      "Answers about AKM Care shopping, shipping, returns, training programmes, services, careers and how to get in touch.",
  },
  "/sell-your-product": {
    path: "/sell-your-product",
    title: "Sell With Us",
    description:
      "Apply to list products on the AKM Care storefront and reach customers across India. Submit your details on the vendor form.",
  },
  "/personal-booking": {
    path: "/personal-booking",
    title: "Personal Booking Links",
    description:
      "Convenience links to third-party travel and shopping sites. These services are not operated by AKM Care — read the disclaimer before you use them.",
  },
  "/media": {
    path: "/media",
    title: "Videos & Media",
    description:
      "Watch AKM Care training and motivation videos on YouTube @akmcare1309, and follow updates on Facebook.",
  },
  "/motivation": {
    path: "/motivation",
    title: "Daily Motivation",
    description:
      "AKM Care daily motivational quotes and archive for professionals, teams and leaders.",
  },
  "/csr": {
    path: "/csr",
    title: "CSR — Community Training",
    description:
      "AKM Care CSR: free soft-skill and motivational training for schools, colleges, NGOs and community groups, subject to trainer availability.",
  },
  "/careers": {
    path: "/careers",
    title: "Careers",
    description:
      "Join AKM Care in Ahmedabad. We review applications for HR, training and operations roles and keep promising candidates in our talent pool.",
  },
  "/disclaimer": {
    path: "/disclaimer",
    title: "Disclaimer",
    description:
      "Legal disclaimer for AKM Care website content, services, product information and Ahmedabad, Gujarat jurisdiction.",
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "How AKM Care collects and uses account, order and contact information. Contact contact@akmcare.in for privacy questions.",
  },
  "/terms": {
    path: "/terms",
    title: "Terms of Use",
    description:
      "Terms for using the AKM Care website, store, training services and related pages. Disputes are subject to Ahmedabad, Gujarat jurisdiction.",
  },
  "/shipping-returns": {
    path: "/shipping-returns",
    title: "Shipping & Returns",
    description:
      "AKM Care pan-India delivery, standard and express timelines, checkout shipping charges, and the 7-day unused-product return policy.",
  },
};

export function getPageSeo(path: string): SeoPageMeta | undefined {
  return PAGE_SEO[path];
}
