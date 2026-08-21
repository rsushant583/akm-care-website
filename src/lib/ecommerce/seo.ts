import type { CatalogProduct } from "./types";
import { absoluteSiteUrl } from "@/lib/config/siteUrl";
import { BRAND } from "@/lib/config/brand";
import { getEffectivePrice } from "./pricing";
import { formatProductShippingCopy } from "@/lib/ecommerce/shippingPolicy";
import { productPath } from "./slug";

function resolveAbsoluteAssetUrl(src: string): string {
  return src.startsWith("http") ? src : absoluteSiteUrl(src);
}

function isMeaningful(value?: string | number | null): boolean {
  if (value == null) return false;
  const t = String(value).trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  return !(
    lower === "na" ||
    lower === "n/a" ||
    lower === "—" ||
    lower === "-" ||
    lower === "null" ||
    lower === "undefined"
  );
}

function generatedProductDescription(product: CatalogProduct): string {
  const source =
    product.seoDescription ||
    product.shortDescription ||
    product.detailedDescription ||
    product.description ||
    product.name;
  const trimmed = source.trim();
  if (trimmed.length >= 40) return trimmed.slice(0, 160);
  const extras = [product.categoryLabel, product.dimensions, `${BRAND.name} pan-India delivery`].filter((part) =>
    isMeaningful(part),
  );
  return `${trimmed}${trimmed.endsWith(".") ? "" : "."} ${extras.join(" · ")}`.trim().slice(0, 160);
}

export type ProductFactFaq = { question: string; answer: string };

/** Fact-only Q&A derived from catalog fields — never invents ratings, origin, or certifications. */
export function productFactFaqs(product: CatalogProduct): ProductFactFaq[] {
  const price = getEffectivePrice(product);
  const faqs: ProductFactFaq[] = [];

  const what = [product.shortDescription, product.detailedDescription, product.description]
    .map((v) => (isMeaningful(v) ? String(v).trim() : ""))
    .find(Boolean);
  faqs.push({
    question: `What is ${product.name}?`,
    answer: what
      ? what.replace(/\s+/g, " ").slice(0, 320)
      : `${product.name} is a ${product.categoryLabel} listed in the ${BRAND.name} catalog.`,
  });

  faqs.push({
    question: `How much does ${product.name} cost?`,
    answer: `The current ${BRAND.name} price is ₹${price.toLocaleString("en-IN")}${
      product.mrp > price ? ` (MRP ₹${product.mrp.toLocaleString("en-IN")})` : ""
    }. The price shown on the product page is the live catalog price.`,
  });

  faqs.push({
    question: `Is ${product.name} in stock?`,
    answer:
      product.stock_quantity > 0
        ? `Yes. This product is listed as in stock (${product.stock_quantity} unit${product.stock_quantity === 1 ? "" : "s"} in the catalog).`
        : `This product is currently out of stock. You can use Notify Me on the product page to request an update.`,
  });

  if (isMeaningful(product.dimensions)) {
    const isSaree = /saree/i.test(product.category) || /saree/i.test(product.categoryLabel);
    faqs.push({
      question: `What size or length is ${product.name}?`,
      answer: isSaree
        ? `Catalog dimensions / length: ${product.dimensions}. On AKM Care, saree length is usually written as metres approximate (Mtrs APX). See /guides/saree-length for how to read it.`
        : `Catalog dimensions / length: ${product.dimensions}.`,
    });
  }

  if (isMeaningful(product.weight)) {
    faqs.push({
      question: `What is the weight of ${product.name}?`,
      answer: `Catalog weight: ${product.weight}.`,
    });
  }

  if (product.colors.length > 0) {
    faqs.push({
      question: `What colours are available?`,
      answer: `Listed colours: ${product.colors.map((c) => c.name).join(", ")}.`,
    });
  }

  if (product.variants.length > 0) {
    faqs.push({
      question: `What variants are available?`,
      answer: `Listed variants: ${product.variants.map((v) => v.name).join(", ")}.`,
    });
  }

  const materialEntry = product.specifications
    ? Object.entries(product.specifications).find(([key]) => /^(material|fabric)$/i.test(key.trim()))
    : undefined;
  if (materialEntry && isMeaningful(materialEntry[1])) {
    const label = /fabric/i.test(materialEntry[0]) ? "fabric" : "material";
    faqs.push({
      question: `What is ${product.name} made of?`,
      answer: `Catalog ${label}: ${String(materialEntry[1]).trim()}.`,
    });
  }

  faqs.push({
    question: `How long does shipping take?`,
    answer: formatProductShippingCopy(product.shippingTime),
  });

  if (isMeaningful(product.returnPolicy)) {
    faqs.push({
      question: `What is the return policy?`,
      answer: String(product.returnPolicy).trim(),
    });
  }

  if (isMeaningful(product.warranty) && String(product.warranty).trim().toLowerCase() !== "na") {
    faqs.push({
      question: `Does ${product.name} include a warranty?`,
      answer: String(product.warranty).trim(),
    });
  }

  return faqs;
}

export function productSeo(product: CatalogProduct) {
  const url = productPath(product.slug);
  const absoluteUrl = absoluteSiteUrl(url);
  const image = product.images[0]?.src
    ? resolveAbsoluteAssetUrl(product.images[0].src)
    : absoluteSiteUrl(BRAND.defaultShareImagePath);

  const price = getEffectivePrice(product);
  const brandName = isMeaningful(product.brand) ? product.brand!.trim() : BRAND.name;
  const seoTitle = product.seoTitle?.trim();
  const seoDescription = product.seoDescription?.trim();
  const title = seoTitle || product.name;
  const description = seoDescription || generatedProductDescription(product);
  const sku = isMeaningful(product.sku) ? product.sku.trim() : undefined;
  const productCode = isMeaningful(product.productCode) ? product.productCode.trim() : undefined;
  const images = product.images
    .map((img) => resolveAbsoluteAssetUrl(img.src))
    .filter(Boolean);
  const hasRealReviews =
    (product.reviewCount ?? 0) > 0 && product.rating != null && Number.isFinite(Number(product.rating));

  const additionalProperty: { "@type": "PropertyValue"; name: string; value: string }[] = [];
  if (productCode) additionalProperty.push({ "@type": "PropertyValue", name: "Product code", value: productCode });
  if (isMeaningful(product.dimensions)) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Dimensions", value: String(product.dimensions) });
  }
  if (isMeaningful(product.weight)) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Weight", value: String(product.weight) });
  }
  if (isMeaningful(product.hsn)) {
    additionalProperty.push({ "@type": "PropertyValue", name: "HSN", value: String(product.hsn) });
  }
  if (product.specifications) {
    for (const [name, value] of Object.entries(product.specifications)) {
      if (!isMeaningful(name) || !isMeaningful(value)) continue;
      additionalProperty.push({ "@type": "PropertyValue", name, value });
    }
  }

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl}#product`,
    name: product.name,
    description: product.shortDescription || product.detailedDescription || description,
    image: images.length ? images : [image],
    brand: { "@type": "Brand", name: brandName },
    category: product.categoryLabel,
    url: absoluteUrl,
    mainEntityOfPage: absoluteUrl,
    offers: {
      "@type": "Offer",
      url: absoluteUrl,
      priceCurrency: "INR",
      price: String(price),
      availability:
        product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: BRAND.name, url: absoluteSiteUrl("/") },
      ...(isMeaningful(product.returnPolicy) && /7\s*day/i.test(String(product.returnPolicy))
        ? {
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "IN",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 7,
              returnMethod: "https://schema.org/ReturnByMail",
            },
          }
        : {}),
    },
  };

  if (sku) schema.sku = sku;
  if (productCode) schema.productID = productCode;
  if (additionalProperty.length) schema.additionalProperty = additionalProperty;
  const colorNames = product.colors.map((c) => c.name).filter((name) => isMeaningful(name) && !/^\d+$/.test(name.trim()));
  if (colorNames.length === 1) schema.color = colorNames[0];
  else if (colorNames.length > 1) schema.color = colorNames;
  const specMaterial =
    product.specifications &&
    Object.entries(product.specifications).find(([key]) => /^(material|fabric)$/i.test(key.trim()))?.[1];
  if (isMeaningful(specMaterial)) schema.material = String(specMaterial).trim();
  if (hasRealReviews) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating).toFixed(1),
      reviewCount: String(product.reviewCount),
    };
  }

  const keywords = [product.name, product.categoryLabel, BRAND.name, ...product.tags]
    .filter((k) => isMeaningful(k))
    .join(", ");

  return {
    title,
    exactTitle: Boolean(seoTitle),
    description,
    keywords,
    canonical: url,
    ogImage: image,
    ogImageAlt: product.images[0]?.alt || product.name,
    ogType: "product" as const,
    schema,
    faqs: productFactFaqs(product),
  };
}

export function shopBreadcrumbs(extra?: { name: string; url: string }[]) {
  return [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    ...(extra ?? []),
  ];
}
