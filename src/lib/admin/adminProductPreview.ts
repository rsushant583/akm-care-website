/**
 * Build a non-persisting storefront-shaped preview from admin form state.
 * Does not create products, orders, or invent fashion attributes.
 */

import type { CatalogProduct } from "@/lib/ecommerce/types";
import { getCategoryLabel } from "@/data/catalog/categories";
import { calcDiscountPercent } from "@/lib/ecommerce/pricing";
import { mergeSpecifications } from "@/lib/ecommerce/productPresentation";
import { getProductBadges } from "@/lib/ecommerce/badges";
import { productSeo } from "@/lib/ecommerce/seo";
import { previewDisplayTitle, getProductDetailRows, getProductDisplayTitle } from "@/lib/ecommerce/productPresentation";

export type AdminFormPreviewInput = {
  name: string;
  slug?: string;
  sku?: string;
  product_code?: string;
  short_description?: string;
  detailed_description?: string;
  description?: string;
  category?: string;
  category_label?: string;
  mrp?: number;
  selling_price?: number;
  akm_care_price?: number;
  price?: number;
  discount_percent?: number;
  stock_quantity?: number;
  status?: string;
  seo_title?: string;
  seo_description?: string;
  is_featured?: boolean;
  is_trending?: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  images?: string[];
  spec_colour?: string;
  spec_fabric?: string;
  spec_work?: string;
  spec_pattern?: string;
  spec_occasion?: string;
  spec_includes?: string;
  spec_care?: string;
  existingSpecifications?: Record<string, unknown>;
};

export function buildPreviewCatalogProduct(input: AdminFormPreviewInput): CatalogProduct {
  const mrp = Number(input.mrp || 0);
  const akm = Number(input.akm_care_price || input.price || input.selling_price || 0);
  const selling = Number(input.selling_price || akm || 0);
  const discount =
    Number(input.discount_percent) > 0
      ? Number(input.discount_percent)
      : calcDiscountPercent(mrp, akm);
  const category = String(input.category || "").trim() || "uncategorized";
  const categoryLabel =
    String(input.category_label || "").trim() || getCategoryLabel(category) || category;
  const specs = mergeSpecifications(input.existingSpecifications || {}, {
    colour: input.spec_colour,
    fabric: input.spec_fabric,
    work: input.spec_work,
    pattern: input.spec_pattern,
    occasion: input.spec_occasion,
    includes: input.spec_includes,
    care: input.spec_care,
  });
  const images = (input.images || []).filter(Boolean).map((src, i) => ({
    src,
    alt: `${input.name || "Product"} image ${i + 1}`,
  }));
  const stock = Math.max(0, Number(input.stock_quantity || 0));
  const status =
    input.status === "sold_out" || input.status === "draft" || input.status === "coming_soon"
      ? input.status
      : stock > 0
        ? "available"
        : "sold_out";

  return {
    id: "preview",
    slug: input.slug || "preview",
    name: input.name || "Untitled product",
    shortDescription: input.short_description || "",
    detailedDescription: input.detailed_description || input.description || "",
    images,
    sku: input.sku || "",
    productCode: input.product_code || "",
    quantity: stock,
    dimensions: "",
    variants: [],
    colors: [],
    mrp,
    sellingPrice: selling,
    akmCarePrice: akm,
    discountPercent: discount,
    gstPercent: 5,
    hsn: "",
    shippingTime: "",
    warranty: "",
    status,
    category,
    categoryLabel,
    tags: [],
    isFeatured: !!input.is_featured,
    isNewArrival: !!input.is_new_arrival,
    isBestSeller: !!input.is_best_seller,
    displayOrder: 0,
    createdAt: new Date().toISOString(),
    price: akm,
    image_url: images[0]?.src || "",
    stock_quantity: stock,
    description: input.detailed_description || input.description || "",
    seoTitle: input.seo_title || undefined,
    seoDescription: input.seo_description || undefined,
    specifications: specs,
  };
}

export function buildAdminProductPreview(input: AdminFormPreviewInput) {
  const product = buildPreviewCatalogProduct(input);
  const titlePreview = previewDisplayTitle(product);
  const seo = productSeo(product);
  const badges = getProductBadges(product, 4);
  const details = getProductDetailRows(product);
  return {
    product,
    displayTitle: getProductDisplayTitle(product),
    titlePreview,
    seo: {
      title: seo.title,
      description: seo.description,
      imageAlt: product.images[0]?.alt || product.name,
    },
    badges,
    details,
  };
}
