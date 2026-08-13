import type { CatalogProduct, ListingViewMode } from "@/lib/ecommerce/types";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  onQuickView,
  view = "grid",
  className,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting filters or search to discover more AKM Care products.",
  onClearFilters,
}: {
  products: CatalogProduct[];
  onQuickView?: (product: CatalogProduct) => void;
  view?: ListingViewMode;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onClearFilters?: () => void;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div
      className={cn(
        view === "list"
          ? "flex flex-col gap-3 sm:gap-4"
          : "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onQuickView={onQuickView} view={view} />
      ))}
    </div>
  );
}
