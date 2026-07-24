import type { CatalogProduct } from "./types";
import { getEffectivePrice } from "./pricing";
import { productPath } from "./slug";

const SITE_URL = "https://akmcare.in";

export function productSeo(product: CatalogProduct) {
  const url = productPath(product.slug);
  const image = product.images[0]?.src
    ? product.images[0].src.startsWith("http")
      ? product.images[0].src
      : `${SITE_URL}${product.images[0].src}`
    : `${SITE_URL}/og-image.jpg`;

  const price = getEffectivePrice(product);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.detailedDescription,
    sku: product.sku,
    productID: product.productCode,
    image: product.images.map((img) =>
      img.src.startsWith("http") ? img.src : `${SITE_URL}${img.src}`,
    ),
    brand: { "@type": "Brand", name: "AKM Care" },
    category: product.categoryLabel,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}${url}`,
      priceCurrency: "INR",
      price: String(price),
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "AKM Care" },
    },
  };

  return {
    title: `${product.name} — Buy Online`,
    description: product.shortDescription.slice(0, 160),
    keywords: [product.name, product.categoryLabel, "AKM Care", ...product.tags].join(", "),
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
