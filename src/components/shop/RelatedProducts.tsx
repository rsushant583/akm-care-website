import type { CatalogProduct } from "@/lib/ecommerce/types";
import { ProductRail } from "./ProductRail";
import { categoryMatchesProduct, getCategoryLabel } from "@/data/catalog/categories";

export function RelatedProducts({
  products,
  currentId,
  category,
  limit = 8,
}: {
  products: CatalogProduct[];
  currentId: string;
  category?: string;
  limit?: number;
}) {
  const pool = products.filter((p) => p.id !== currentId);
  const sameCategory = category
    ? pool.filter((p) => p.category === category || categoryMatchesProduct(category, p))
    : [];
  const rest = sameCategory.length ? pool.filter((p) => !sameCategory.some((s) => s.id === p.id)) : pool;
  const related = [...sameCategory, ...rest].slice(0, limit);

  if (related.length === 0) return null;

  return (
    <ProductRail
      id="related-products"
      title={sameCategory.length >= 2 ? "More from this category" : "Related products"}
      subtitle="Similar pieces from the AKM Care catalog"
      products={related}
      minItems={1}
      ctaLabel={category ? `Browse ${getCategoryLabel(category) || "this category"}` : "Browse the shop"}
      ctaHref={category ? `/shop?category=${encodeURIComponent(category)}` : "/shop"}
      className="mt-12 sm:mt-16"
    />
  );
}
