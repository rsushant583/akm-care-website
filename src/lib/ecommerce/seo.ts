import type { CatalogProduct } from "./types";
import { absoluteSiteUrl, getCanonicalSiteOrigin } from "@/lib/config/siteUrl";
import { getEffectivePrice } from "./pricing";
import { productPath } from "./slug";

const DEFAULT_BRAND = "AKM Care";

function resolveAbsoluteAssetUrl(src: string): string {
  return src.startsWith("http") ? src : absoluteSiteUrl(src);
}

function generatedProductTitle(product: CatalogProduct): string {
  return `${product.name} — Buy Online`;
}

function generatedProductDescription(product: CatalogProduct): string {
  const source = product.shortDescription || product.detailedDescription || product.description || product.name;
  return source.trim().slice(0, 160) || `${product.name} — shop online at AKM Care.`;
}

export function productSeo(product: CatalogProduct) {
  const url = productPath(product.slug);
  const image = product.images[0]?.src
    ? resolveAbsoluteAssetUrl(product.images[0].src)
    : absoluteSiteUrl("/og-image.jpg");

  const price = getEffectivePrice(product);
  const brandName = product.brand?.trim() || DEFAULT_BRAND;
  const seoTitle = product.seoTitle?.trim();
  const seoDescription = product.seoDescription?.trim();
  const title = seoTitle || generatedProductTitle(product);
  const description = seoDescription || generatedProductDescription(product);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.detailedDescription || description,
    sku: product.sku,
    productID: product.productCode,
    image: product.images.map((img) => resolveAbsoluteAssetUrl(img.src)),
    brand: { "@type": "Brand", name: brandName },
    category: product.categoryLabel,
    offers: {
      "@type": "Offer",
      url: absoluteSiteUrl(url),
      priceCurrency: "INR",
      price: String(price),
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: DEFAULT_BRAND },
    },
  };

  return {
    title,
    exactTitle: Boolean(seoTitle),
    description,
    keywords: [product.name, product.categoryLabel, DEFAULT_BRAND, ...product.tags].join(", "),
    canonical: url,
    ogImage: image,
    ogType: "product" as const,
    schema,
  };
}

export function shopBreadcrumbs(extra?: { name: string; url: string }[]) {
  return [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    ...(extra ?? []),
  ];
}
