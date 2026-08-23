import type { CatalogProduct, ProductColorOption, ProductImage, ProductVariantOption } from "@/lib/ecommerce/types";
import { calcDiscountPercent } from "@/lib/ecommerce/pricing";
import { slugify } from "@/lib/ecommerce/slug";
import { SHIPPING_POLICY } from "@/lib/ecommerce/shippingPolicy";

/** Row shape from `catalog_product_list` view or products + joined payloads */
export type CatalogListRow = {
  id: string;
  slug: string | null;
  name: string;
  sku: string | null;
  product_code: string | null;
  short_description: string | null;
  detailed_description: string | null;
  description: string | null;
  mrp: number | null;
  selling_price: number | null;
  akm_care_price: number | null;
  effective_price?: number | null;
  discount_percent: number | null;
  gst_percent: number | null;
  gst_number: string | null;
  hsn: string | null;
  weight: string | null;
  dimensions: string | null;
  stock_quantity: number | null;
  status: string | null;
  shipping_time: string | null;
  warranty: string | null;
  packing_type: string | null;
  freight_cost: string | null;
  video_url: string | null;
  category_slug: string | null;
  category_label: string | null;
  tags: unknown;
  rating: number | null;
  review_count: number | null;
  is_featured: boolean | null;
  is_new_arrival: boolean | null;
  is_best_seller: boolean | null;
  is_trending: boolean | null;
  popularity: number | null;
  display_order: number | null;
  seo_title: string | null;
  seo_description: string | null;
  specifications: unknown;
  price: number | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  brand_id?: string | null;
  brand_name?: string | null;
  brand_slug?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  subcategory_id?: string | null;
  subcategory_name?: string | null;
  subcategory_slug?: string | null;
  images?: unknown;
  variants?: unknown;
  colors?: unknown;
};

function asImages(raw: unknown, fallbackName: string, fallbackUrl?: string | null): ProductImage[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((img, i) => {
        const row = img as Record<string, unknown>;
        const src = String(row.src ?? row.url ?? "");
        if (!src) return null;
        return {
          src,
          alt: String(row.alt ?? `${fallbackName} ${i + 1}`),
          color: row.color ? String(row.color) : undefined,
        };
      })
      .filter(Boolean) as ProductImage[];
  }
  if (fallbackUrl) return [{ src: fallbackUrl, alt: fallbackName }];
  return [];
}

function asVariants(raw: unknown): ProductVariantOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v, i) => {
    const row = v as Record<string, unknown>;
    return {
      id: String(row.id ?? `variant-${i}`),
      name: String(row.name ?? "Standard"),
      skuSuffix: row.skuSuffix ? String(row.skuSuffix) : row.sku_suffix ? String(row.sku_suffix) : undefined,
      stock: row.stock != null ? Number(row.stock) : undefined,
    };
  });
}

function asColors(raw: unknown): ProductColorOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c, i) => {
    const row = c as Record<string, unknown>;
    return {
      id: String(row.id ?? `color-${i}`),
      name: String(row.name ?? "Default"),
      hex: String(row.hex ?? "#CCCCCC"),
      imageIndexes: Array.isArray(row.imageIndexes)
        ? (row.imageIndexes as number[])
        : Array.isArray(row.image_indexes)
          ? (row.image_indexes as number[])
          : undefined,
    };
  });
}

function asTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

export function mapCatalogRow(row: CatalogListRow, index = 0): CatalogProduct {
  const name = row.name || "Product";
  const mrp = Number(row.mrp ?? row.price ?? 0);
  const akmCarePrice = Number(row.akm_care_price ?? row.effective_price ?? row.selling_price ?? row.price ?? 0);
  const sellingPrice = Number(row.selling_price ?? akmCarePrice);
  const images = asImages(row.images, name, row.image_url);
  const stock = Number(row.stock_quantity ?? 0);
  const slug = row.slug || slugify(name);
  const rawStatus = (row.status as CatalogProduct["status"]) || null;
  const status: CatalogProduct["status"] =
    stock > 0
      ? "available"
      : rawStatus === "coming_soon" || rawStatus === "draft"
        ? rawStatus
        : "sold_out";

  return {
    id: String(row.id),
    slug,
    name,
    shortDescription: String(row.short_description ?? row.description ?? ""),
    detailedDescription: String(row.detailed_description ?? row.description ?? ""),
    images,
    videoUrl: row.video_url,
    sku: String(row.sku ?? row.product_code ?? ""),
    productCode: String(row.product_code ?? row.sku ?? ""),
    quantity: stock,
    dimensions: String(row.dimensions ?? ""),
    weight: row.weight,
    variants: asVariants(row.variants),
    colors: asColors(row.colors),
    mrp,
    sellingPrice,
    akmCarePrice,
    discountPercent: Number(row.discount_percent ?? calcDiscountPercent(mrp, akmCarePrice)),
    gstPercent: Number(row.gst_percent ?? 5),
    gstNumber: row.gst_number ?? undefined,
    hsn: String(row.hsn ?? ""),
    shippingTime: String(row.shipping_time ?? SHIPPING_POLICY.standardWindow),
    warranty: String(row.warranty ?? "NA"),
    packingType: row.packing_type ?? undefined,
    freightCost: row.freight_cost,
    status,
    category: (row.category_slug as CatalogProduct["category"]) ?? "",
    categoryLabel: String(row.category_label ?? row.category_name ?? ""),
    brand: row.brand_name ?? "AKM Care",
    returnPolicy: SHIPPING_POLICY.returnSummary,
    tags: asTags(row.tags),
    rating: row.rating != null && Number(row.review_count ?? 0) > 0 ? Number(row.rating) : undefined,
    reviewCount: row.review_count != null ? Number(row.review_count) : 0,
    isFeatured: Boolean(row.is_featured),
    isNewArrival: Boolean(row.is_new_arrival),
    isBestSeller: Boolean(row.is_best_seller),
    popularity: Number(row.popularity ?? 0),
    displayOrder: Number(row.display_order ?? index),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    price: akmCarePrice,
    image_url: images[0]?.src ?? row.image_url ?? "",
    stock_quantity: stock,
    description: String(row.description ?? row.short_description ?? ""),
    seoTitle: row.seo_title?.trim() || undefined,
    seoDescription: row.seo_description?.trim() || undefined,
  };
}
