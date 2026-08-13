import type { CatalogProduct } from "@/lib/ecommerce/types";
import { ProductGrid } from "./ProductGrid";

export function RelatedProducts({
  products,
  currentId,
  category,
  limit = 4,
}: {
  products: CatalogProduct[];
  currentId: string;
  /** Prefer same category when present */
  category?: string;
  limit?: number;
}) {
  const pool = products.filter((p) => p.id !== currentId);
  const sameCategory = category
    ? pool.filter((p) => p.category === category || p.categoryLabel === category)
    : [];
  const related = (sameCategory.length >= 2 ? sameCategory : pool)
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, limit);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16" aria-labelledby="related-products-heading">
      <h2 id="related-products-heading" className="type-section mb-5">
        Related products
      </h2>
      <ProductGrid products={related} />
    </section>
  );
}
