/** Official customer-facing shop categories (business-provided). */

export type OfficialCategoryId =
  | "all"
  | "sarees"
  | "ladies-gown"
  | "stitched-lehenga"
  | "unstitched-lehenga"
  | "semi-stitched-gown"
  | "semi-stitched-lehenga"
  | "semi-stitched-blouse"
  | "3-piece-suits"
  | "mens-jeans";

export type OfficialShopCategory = {
  id: OfficialCategoryId;
  label: string;
  /** Optional merchandising image. Leave unset until a real asset exists. */
  imageSrc?: string;
};

export const OFFICIAL_SHOP_CATEGORIES: readonly OfficialShopCategory[] = [
  { id: "all", label: "All" },
  { id: "sarees", label: "Sarees" },
  { id: "ladies-gown", label: "Ladies Gown" },
  { id: "stitched-lehenga", label: "Stitched Lehenga" },
  { id: "unstitched-lehenga", label: "Unstitched Lehenga" },
  { id: "semi-stitched-gown", label: "Semi Stitched Gown" },
  { id: "semi-stitched-lehenga", label: "Semi Stitched Lehenga" },
  { id: "semi-stitched-blouse", label: "Semi Stitched Blouse" },
  { id: "3-piece-suits", label: "3-Piece Suit — Salwar + Dupatta" },
  { id: "mens-jeans", label: "Men's Jeans" },
] as const;

/** Categories shown in nav / homepage (excludes "All"). */
export const OFFICIAL_BROWSABLE_CATEGORIES = OFFICIAL_SHOP_CATEGORIES.filter((c) => c.id !== "all");

export function shopCategoryPath(categoryId: string): string {
  if (!categoryId || categoryId === "all") return "/shop";
  return `/shop?category=${encodeURIComponent(categoryId)}`;
}

export function shopCollectionPath(collection: string): string {
  return `/shop?collection=${encodeURIComponent(collection)}`;
}

export function getCategoryLabel(id: string): string | undefined {
  const normalized = id === "3-piece-suit" ? "3-piece-suits" : id;
  return OFFICIAL_SHOP_CATEGORIES.find((c) => c.id === normalized)?.label;
}

/** Terms used to match catalog rows for a category slug (slug + label variants). */
export function getCategoryMatchTerms(slug: string): string[] {
  const meta = OFFICIAL_SHOP_CATEGORIES.find((c) => c.id === slug);
  const terms = new Set<string>();
  terms.add(slug);
  if (meta) {
    terms.add(meta.label);
    terms.add(meta.label.replace(/'/g, ""));
    terms.add(meta.label.toLowerCase());
  }
  terms.add(slug.replace(/-/g, " "));
  return [...terms].filter(Boolean);
}

export function categoryMatchesProduct(
  categorySlug: string,
  product: { category: string; categoryLabel: string },
): boolean {
  if (!categorySlug || categorySlug === "all") return true;
  const slug = categorySlug.toLowerCase();
  const productSlug = product.category.toLowerCase();
  // Exact products.category slug is authoritative.
  if (productSlug === slug) return true;
  // If the product already has a different official slug, do not fuzzy-match
  // into another category (e.g. "semi stitched lehenga" must not match
  // "stitched-lehenga" via substring includes).
  const hasOtherOfficialSlug = OFFICIAL_BROWSABLE_CATEGORIES.some((c) => c.id === productSlug);
  if (hasOtherOfficialSlug) return false;
  const label = product.categoryLabel.toLowerCase();
  return getCategoryMatchTerms(slug).some((term) => label.includes(term.toLowerCase()));
}

export type ShopCollectionId = "deals" | "featured" | "best-sellers" | "new-arrivals";

export const SHOP_COLLECTIONS: { id: ShopCollectionId; label: string }[] = [
  { id: "deals", label: "Deals" },
  { id: "featured", label: "Featured" },
  { id: "best-sellers", label: "Best Sellers" },
  { id: "new-arrivals", label: "New Arrivals" },
];

export function isShopCollection(value: string | null | undefined): value is ShopCollectionId {
  return value === "deals" || value === "featured" || value === "best-sellers" || value === "new-arrivals";
}
