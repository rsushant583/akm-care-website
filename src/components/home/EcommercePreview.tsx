import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useCatalogMerchandising, useCatalogProducts } from "@/hooks/useCatalogProducts";
import { ProductGrid, ProductGridSkeleton, RecentlyViewedStrip } from "@/components/shop";
import { shopCollectionPath } from "@/data/catalog/categories";
import type { CatalogProduct } from "@/lib/ecommerce/types";

function dedupeById(lists: CatalogProduct[][], excludeIds?: Set<string>): CatalogProduct[] {
  const seen = new Set<string>(excludeIds ? [...excludeIds] : []);
  const out: CatalogProduct[] = [];
  for (const list of lists) {
    for (const p of list) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

/** Homepage catalog — same catalog SoT as Shop; hide empty / duplicate merch rows. */
export default function EcommercePreview() {
  const { featured, bestSellers, deals, newArrivals, loading: merchLoading } = useCatalogMerchandising(8);
  const { data: catalogPreview, loading: catalogLoading } = useCatalogProducts({
    pageSize: 8,
    enablePagination: false,
  });

  const loading = merchLoading || catalogLoading;

  const primary = useMemo(() => {
    if (featured.length > 0) return featured;
    return catalogPreview.slice(0, 8);
  }, [featured, catalogPreview]);

  const primaryIds = useMemo(() => new Set(primary.map((p) => p.id)), [primary]);

  const uniqueNew = useMemo(
    () => dedupeById([newArrivals], primaryIds).slice(0, 8),
    [newArrivals, primaryIds],
  );
  const uniqueDeals = useMemo(
    () => dedupeById([deals], new Set([...primaryIds, ...uniqueNew.map((p) => p.id)])).slice(0, 8),
    [deals, primaryIds, uniqueNew],
  );
  const uniqueBest = useMemo(() => {
    const exclude = new Set([...primaryIds, ...uniqueNew.map((p) => p.id), ...uniqueDeals.map((p) => p.id)]);
    return dedupeById([bestSellers], exclude).slice(0, 8);
  }, [bestSellers, primaryIds, uniqueNew, uniqueDeals]);

  const showPrimary = primary.length > 0;
  const catalogIsTiny = catalogPreview.length > 0 && catalogPreview.length <= 8;
  /** Avoid repeating the same small catalog under multiple merch headings. */
  const allowExtraMerch = !catalogIsTiny || featured.length > 0;

  return (
    <div>
      <section className="bg-[#FAF8F5] py-8 sm:py-10 lg:py-12" aria-labelledby="featured-products-heading">
        <div className="container-premium space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-2">
                {featured.length > 0 ? "Featured" : "Shop"}
              </p>
              <h2 id="featured-products-heading" className="type-section">
                {featured.length > 0 ? "Handpicked for you" : "Shop our products"}
              </h2>
              <p className="type-meta mt-1.5 text-sm">Live catalog pricing, images, and stock</p>
            </div>
            <Link to="/shop" className="btn-tertiary">
              Shop all
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : showPrimary ? (
            <ProductGrid products={primary} />
          ) : (
            <p className="text-sm text-[#6B6B6B]">Products will appear here once published in Admin.</p>
          )}
        </div>
      </section>

      {allowExtraMerch && !loading && uniqueNew.length >= 2 && (
        <section className="section-padding pt-2 pb-8 bg-white" aria-labelledby="new-arrivals-heading">
          <div className="container-premium space-y-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8621A] mb-2">Just in</p>
                <h2 id="new-arrivals-heading" className="font-heading text-2xl sm:text-3xl">
                  New arrivals
                </h2>
              </div>
              <Link to={shopCollectionPath("new-arrivals")} className="text-sm font-semibold text-[#E8621A] hover:underline">
                See all
              </Link>
            </div>
            <ProductGrid products={uniqueNew} />
          </div>
        </section>
      )}

      {allowExtraMerch && !loading && uniqueDeals.length >= 2 && (
        <section className="section-padding pt-2 pb-8 bg-[#FAF8F5]" aria-labelledby="deals-heading">
          <div className="container-premium space-y-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8621A] mb-2">Offers</p>
                <h2 id="deals-heading" className="font-heading text-2xl sm:text-3xl">
                  Deals &amp; discounts
                </h2>
              </div>
              <Link to={shopCollectionPath("deals")} className="text-sm font-semibold text-[#E8621A] hover:underline">
                See all
              </Link>
            </div>
            <ProductGrid products={uniqueDeals} />
          </div>
        </section>
      )}

      {allowExtraMerch && !loading && uniqueBest.length >= 2 && (
        <section className="section-padding pt-2 pb-8 bg-white" aria-labelledby="best-sellers-heading">
          <div className="container-premium space-y-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8621A] mb-2">Bestsellers</p>
                <h2 id="best-sellers-heading" className="font-heading text-2xl sm:text-3xl">
                  Customer favourites
                </h2>
              </div>
              <Link to={shopCollectionPath("best-sellers")} className="text-sm font-semibold text-[#E8621A] hover:underline">
                See all
              </Link>
            </div>
            <ProductGrid products={uniqueBest} />
          </div>
        </section>
      )}

      <section className="section-padding pt-2 pb-6 bg-white">
        <div className="container-premium">
          <RecentlyViewedStrip />
        </div>
      </section>
    </div>
  );
}
