import type { CatalogProduct } from "@/lib/ecommerce/types";
import { ProductGrid } from "./ProductGrid";

export function RelatedProducts({
  products,
  currentId,
  limit = 4,
}: {
  products: CatalogProduct[];
  currentId: string;
  limit?: number;
}) {
  const related = products
    .filter((p) => p.id !== currentId)
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, limit);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16">
      <h2 className="font-heading text-2xl mb-4">Related Products</h2>
      <ProductGrid products={related} />
    </section>
  );
}
