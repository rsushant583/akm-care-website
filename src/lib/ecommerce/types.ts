/** Scalable ecommerce product model — ready for admin/vendor sync */

export type ProductAvailability = "available" | "sold_out" | "coming_soon" | "draft";

export type ProductCategorySlug =
  | "sarees"
  | "ladies-gown"
  | "stitched-lehenga"
  | "unstitched-lehenga"
  | "semi-stitched-gown"
  | "semi-stitched-lehenga"
  | "semi-stitched-blouse"
  | "3-piece-suits"
  | "mens-jeans"
  /** Legacy / seed catalog values — still readable */
  | "apparel"
  | "imitation-jewelry"
  | "food"
  | "organic"
  | "local"
  | string;

export interface ProductImage {
  /** Public URL path, e.g. /catalog/akmc-sani-1007/01.png */
  src: string;
  alt: string;
  color?: string;
}

export interface ProductColorOption {
  id: string;
  name: string;
  hex: string;
  /** Optional image indices belonging to this color */
  imageIndexes?: number[];
}

export interface ProductVariantOption {
  id: string;
  name: string;
  skuSuffix?: string;
  stock?: number;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  images: ProductImage[];
  /** Future-ready product video URL */
  videoUrl?: string | null;
  sku: string;
  productCode: string;
  /** Sellable units in inventory */
  quantity: number;
  /** Pack / size label for display (e.g. "6.2 Mtrs APX") */
  dimensions: string;
  weight?: string | null;
  variants: ProductVariantOption[];
  colors: ProductColorOption[];
  mrp: number;
  sellingPrice: number;
  akmCarePrice: number;
  /** 0–100 */
  discountPercent: number;
  gstPercent: number;
  gstNumber?: string;
  hsn: string;
  shippingTime: string;
  warranty: string;
  packingType?: string;
  freightCost?: string | null;
  status: ProductAvailability;
  category: ProductCategorySlug;
  categoryLabel: string;
  brand?: string;
  returnPolicy?: string;
  tags: string[];
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  popularity?: number;
  displayOrder: number;
  createdAt: string;
  /** Backward-compat for existing Shop / payment code */
  price: number;
  image_url: string;
  stock_quantity: number;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
}

export type SortOption = "newest" | "price-asc" | "price-desc" | "popularity" | "discount";
export type ListingViewMode = "grid" | "list";

export interface ShopFilters {
  category: string;
  priceMin: number | null;
  priceMax: number | null;
  colors: string[];
  variants: string[];
  availability: "all" | "in_stock" | "out_of_stock";
  query: string;
}

export interface CartLineItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  sku: string;
  unitPrice: number;
  mrp: number;
  gstPercent: number;
  quantity: number;
  colorId?: string;
  colorName?: string;
  variantId?: string;
  variantName?: string;
  maxQuantity: number;
}

export interface SavedForLaterItem extends CartLineItem {}

export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export type PaymentMethodId = "razorpay" | "cod" | "upi";

export interface CheckoutDraft {
  customer: CheckoutCustomer;
  address: CheckoutAddress;
  shippingMethod: "standard" | "express";
  paymentMethod: PaymentMethodId;
  couponCode?: string;
  notes?: string;
}
