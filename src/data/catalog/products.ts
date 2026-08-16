import type { CatalogProduct } from "@/lib/ecommerce/types";
import { calcDiscountPercent } from "@/lib/ecommerce/pricing";
import { products as legacyFoodProducts } from "@/data/fallback";

/** Resolve catalog image paths from folder + count (no hardcoded paths in UI). */
function catalogImages(folder: string, count: number, altBase: string, color?: string) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      src: `/catalog/${folder}/${n}.png`,
      alt: `${altBase} — view ${i + 1}`,
      color,
    };
  });
}

/** Supabase Storage URLs for products that ship CDN-first (reliable on deploy). */
function storageCatalogImages(folder: string, count: number, altBase: string) {
  const base = `https://tdqepnmysycxklqcvpai.supabase.co/storage/v1/object/public/products/${folder}`;
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      src: `${base}/image-${n}.webp`,
      alt: `${altBase} — view ${i + 1}`,
    };
  });
}

const sareeColorsSani = [
  { id: "off-white", name: "Off White", hex: "#E8E6E1", imageIndexes: [0, 1, 2] },
  { id: "light-grey", name: "Light Grey", hex: "#C8C9CA", imageIndexes: [3, 4, 5, 6] },
  { id: "ivory-gold", name: "Ivory Gold", hex: "#D4C4A8" },
  { id: "pearl", name: "Pearl", hex: "#F5F2EB" },
  { id: "silver-mist", name: "Silver Mist", hex: "#B8BCC0" },
  { id: "champagne", name: "Champagne", hex: "#C9B896" },
];

const sareeColorsRooh = [
  { id: "sage-green", name: "Sage Green", hex: "#8FA89A", imageIndexes: [0, 1] },
  { id: "dusty-mauve", name: "Dusty Mauve", hex: "#A88986", imageIndexes: [2, 3] },
  { id: "grey-embroidered", name: "Grey Embroidered", hex: "#9A9A9A", imageIndexes: [4] },
  { id: "dusty-rose", name: "Dusty Rose", hex: "#C49A9A", imageIndexes: [5, 6, 7] },
  { id: "blush", name: "Blush", hex: "#D4A5A5" },
  { id: "mocha", name: "Mocha", hex: "#9C7E6E" },
];

const sareeColorsTurquoise = [
  { id: "turquoise", name: "Turquoise", hex: "#0D9B9B", imageIndexes: [0, 1, 2, 3, 4, 5, 6, 7] },
];

function buildSaree(input: {
  id: string;
  folder: string;
  imageCount: number;
  name: string;
  sku: string;
  productCode: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  akmCarePrice: number;
  colors: typeof sareeColorsSani;
  displayOrder: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  popularity: number;
  createdAt: string;
  shortDescription?: string;
  detailedDescription?: string;
  dimensions?: string;
  variantName?: string;
  packingType?: string;
  gstPercent?: number;
  hsn?: string;
  tags?: string[];
  /** When true, use Supabase Storage WebP URLs instead of /catalog/... PNG paths. */
  useStorageImages?: boolean;
}): CatalogProduct {
  const discountPercent =
    typeof input.mrp === "number"
      ? calcDiscountPercent(input.mrp, input.akmCarePrice)
      : 14;
  const images = input.useStorageImages
    ? storageCatalogImages(input.folder, input.imageCount, input.name)
    : catalogImages(input.folder, input.imageCount, input.name);
  const shortDescription = input.shortDescription ?? "Chanderi Print Saree with unstitched Blouse";
  const detailedDescription =
    input.detailedDescription ??
    "Premium Chanderi print saree (approx. 6.2 metres) with unstitched blouse piece. Elegant floral vine work, finished border, and festive-ready drape. Sourced for AKM Care — Trusted & Fair apparel.";

  const status = input.quantity > 0 ? ("available" as const) : ("sold_out" as const);
  const packingType = input.packingType ?? "Polythene Packing";
  const variantName = input.variantName ?? "PRINT";
  const tags = input.tags ?? ["Chanderi", "Ethnic Wear", "Apparel", "Print", "Women", "AKM Care"];

  return {
    id: input.id,
    slug: input.folder,
    name: input.name,
    shortDescription,
    detailedDescription,
    images,
    videoUrl: null,
    sku: input.sku,
    productCode: input.productCode,
    quantity: input.quantity,
    dimensions: input.dimensions ?? "6.2 Mtrs APX",
    weight: null,
    variants: [{ id: variantName.toLowerCase().replace(/\s+/g, "-"), name: variantName, stock: input.quantity }],
    colors: input.colors,
    mrp: input.mrp,
    sellingPrice: input.sellingPrice,
    akmCarePrice: input.akmCarePrice,
    discountPercent,
    gstPercent: input.gstPercent ?? 5,
    gstNumber: "24AIFPB2688G1ZG",
    hsn: input.hsn ?? "540752",
    shippingTime: "within 24 Hours",
    warranty: "NA — within 7 days return policy",
    packingType,
    freightCost: null,
    status,
    category: "sarees",
    categoryLabel: "Sarees",
    brand: "AKM Care",
    returnPolicy: "7 days return policy — unused product with original packing",
    tags,
    rating: 4.5,
    reviewCount: 0,
    isFeatured: input.isFeatured,
    isNewArrival: input.isNewArrival,
    isBestSeller: input.isBestSeller,
    popularity: input.popularity,
    displayOrder: input.displayOrder,
    createdAt: input.createdAt,
    price: input.akmCarePrice,
    image_url: images[0]?.src ?? "",
    stock_quantity: input.quantity,
    description: shortDescription,
  };
}

/** Imported from data/imports/products.xlsx (Pd Data.xlsx) + catalog photos */
export const catalogProductsFromExcel: CatalogProduct[] = [
  buildSaree({
    id: "excel-6",
    folder: "akmc-turquoise-zari",
    imageCount: 8,
    name: "AKMC Turquoise Zari Silk Saree",
    sku: "AKMCTQZ",
    productCode: "AKMCTQZ",
    quantity: 5,
    mrp: 4290,
    sellingPrice: 4290,
    akmCarePrice: 3699,
    colors: sareeColorsTurquoise,
    displayOrder: 0,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    popularity: 100,
    createdAt: "2026-08-16T04:00:00.000Z",
    shortDescription: "Turquoise silk saree with gold zari border & blouse",
    detailedDescription:
      "Vibrant turquoise silk saree with antique gold and copper zari butis, ornate mandala border, and matching short-sleeve blouse. Festive-ready drape with rich sheen — sourced for AKM Care — Trusted & Fair apparel.",
    dimensions: "6.3 Mtrs APX",
    variantName: "Silk Zari",
    packingType: "Box Packing",
    gstPercent: 5,
    hsn: "540710",
    tags: ["Silk", "Zari", "Turquoise", "Ethnic Wear", "Saree", "Apparel", "AKM Care"],
    useStorageImages: true,
  }),
  buildSaree({
    id: "excel-1",
    folder: "akmc-sani-1007",
    imageCount: 7,
    name: "AKMC SANI - 1007",
    sku: "AKMCC90",
    productCode: "AKMCC90",
    quantity: 8,
    mrp: 546,
    sellingPrice: 546,
    akmCarePrice: 468,
    colors: sareeColorsSani,
    displayOrder: 1,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    popularity: 98,
    createdAt: "2026-07-19T12:00:00.000Z",
  }),
  buildSaree({
    id: "excel-2",
    folder: "akmc-rooh-0002",
    imageCount: 8,
    name: "AKMC ROOH - 0002",
    sku: "AKMCE95",
    productCode: "AKMCE95",
    quantity: 6,
    mrp: 833,
    sellingPrice: 833,
    akmCarePrice: 714,
    colors: sareeColorsRooh,
    displayOrder: 2,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    popularity: 92,
    createdAt: "2026-07-19T12:30:00.000Z",
  }),
];

/** Preserve existing village / food listings alongside apparel catalog */
export const legacyCatalogProducts: CatalogProduct[] = legacyFoodProducts.map((p, index) => {
  const mrp = Math.round(Number(p.price) * 1.15);
  const akm = Number(p.price);
  const images = p.image_url
    ? [{ src: p.image_url, alt: p.name }]
    : [];
  return {
    id: `legacy-${p.id}`,
    slug: `legacy-${p.id}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: p.name,
    shortDescription: p.description,
    detailedDescription: p.description,
    images,
    videoUrl: null,
    sku: `AKM-FOOD-${p.id}`,
    productCode: `AKM-FOOD-${p.id}`,
    quantity: p.stock_quantity ?? 0,
    dimensions: p.quantity,
    weight: p.quantity,
    variants: [{ id: "standard", name: "Standard" }],
    colors: [],
    mrp,
    sellingPrice: akm,
    akmCarePrice: akm,
    discountPercent: calcDiscountPercent(mrp, akm),
    gstPercent: 5,
    hsn: "210690",
    shippingTime: "3–5 business days",
    warranty: "NA",
    status: (p.stock_quantity ?? 0) > 0 ? "available" : "sold_out",
    category: "food",
    categoryLabel: "Food",
    brand: "AKM Care",
    returnPolicy: "NA",
    tags: ["Village", "Organic", "Local", "AKM Care"],
    rating: 4.2,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: index < 2,
    popularity: 40 - index,
    displayOrder: 100 + index,
    createdAt: "2026-01-01T00:00:00.000Z",
    price: akm,
    image_url: p.image_url || "",
    stock_quantity: p.stock_quantity ?? 0,
    description: p.description,
  };
});

export const allCatalogProducts: CatalogProduct[] = [
  ...catalogProductsFromExcel,
  ...legacyCatalogProducts,
];

export { OFFICIAL_SHOP_CATEGORIES as SHOP_CATEGORIES } from "@/data/catalog/categories";
