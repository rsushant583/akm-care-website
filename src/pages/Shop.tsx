import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Filter, LayoutGrid, List, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/lib/schemas";
import {
  useCatalogFacets,
  useCatalogMerchandising,
  useCatalogProducts,
} from "@/hooks/useCatalogProducts";
import { DEFAULT_FILTERS } from "@/lib/ecommerce/filters";
import type { CatalogProduct, ListingViewMode, ShopFilters, SortOption } from "@/lib/ecommerce/types";
import { shopBreadcrumbs } from "@/lib/ecommerce/seo";
import { useCart } from "@/context/CartContext";
import { isValidIndianPincode, mockDeliveryAvailable } from "@/lib/pincodeDelivery";
import { submitProductInterest } from "@/lib/submissions";
import { toast } from "@/components/ui/sonner";
import {
  CategoryStrip,
  EmptyState,
  ErrorState,
  ProductFilters,
  ProductGrid,
  ProductGridSkeleton,
  ProductSearch,
  ProductSection,
  QuickViewModal,
  RecentlyViewedStrip,
  ShopBreadcrumbs,
  ShopHero,
} from "@/components/shop";
import { cn } from "@/lib/utils";

export default function Shop() {
  const { itemCount } = useCart();
  const [filters, setFilters] = useState<ShopFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("newest");
  const [view, setView] = useState<ListingViewMode>("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickView, setQuickView] = useState<CatalogProduct | null>(null);
  const [showNotify, setShowNotify] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinStatus, setPinStatus] = useState<"idle" | "invalid" | "ok" | "no">("idle");

  const {
    data: filtered,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    offline,
    loadMore,
    refetch,
  } = useCatalogProducts({ filters, sort, enablePagination: true });

  const { featured, newArrivals, bestSellers } = useCatalogMerchandising();
  const dbFacets = useCatalogFacets();

  const facets = useMemo(
    () => ({
      colors: dbFacets.colors,
      variants: dbFacets.variants,
      priceRange: dbFacets.priceRange.min || dbFacets.priceRange.max
        ? dbFacets.priceRange
        : { min: 0, max: 5000 },
    }),
    [dbFacets],
  );

  const crumbs = shopBreadcrumbs();

  const checkPincode = () => {
    const p = pinInput.trim();
    if (!isValidIndianPincode(p)) {
      setPinStatus("invalid");
      return;
    }
    setPinStatus(mockDeliveryAvailable(p) ? "ok" : "no");
  };

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitProductInterest({
      name,
      email,
      product_name: selectedProduct || "General product update",
    });
    if (!result.success) {
      toast.error("Could not save your interest right now.");
      return;
    }
    toast.success("Thank you! We will notify you when available.");
    setShowNotify(false);
    setEmail("");
    setName("");
    setSelectedProduct("");
  };

  return (
    <>
      <SEO
        title="Shop — Authentic Apparel & Clothing Items | Sarees, Apparels, Clothing items, Makhana, Sattu & More"
        description="Buy authentic rural Indian products online — premium Makhana (Fox Nuts), Sattu Powder, Fancy Sarees & Textile Products. Sourced for AKM Care, delivered pan-India."
        keywords="buy makhana online, sattu powder online, chanderi saree, AKM Care shop, village products India"
        canonical="/shop"
        schema={breadcrumbSchema(crumbs)}
      />

      <ShopHero />

      <section className="section-padding bg-white pt-4">
        <div className="container-premium space-y-10">
          <ShopBreadcrumbs items={crumbs} />

          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <CategoryStrip
              active={filters.category}
              onSelect={(id) => setFilters((f) => ({ ...f, category: id }))}
            />
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <ProductSearch
                value={filters.query}
                onChange={(query) => setFilters((f) => ({ ...f, query }))}
                className="flex-1 lg:w-80"
              />
              <button
                type="button"
                className="lg:hidden inline-flex items-center gap-2 px-3 py-3 rounded-xl border border-black/[0.08] text-sm font-semibold"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 px-3 py-3 rounded-xl bg-[#E8621A] text-white text-sm font-semibold"
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Cart</span> ({itemCount})
              </Link>
            </div>
          </div>

          <div className="max-w-xl bg-white rounded-2xl border border-black/[0.08] p-5 sm:p-6 shadow-sm">
            <h2 className="font-heading text-lg sm:text-xl mb-1">Check Delivery Availability by Pincode</h2>
            <p className="text-sm text-muted-foreground mb-4">Enter your 6-digit Indian pincode</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Pincode"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setPinStatus("idle");
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
              />
              <button
                type="button"
                onClick={checkPincode}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all whitespace-nowrap"
              >
                Check Availability
              </button>
            </div>
            {pinStatus === "invalid" && (
              <p className="text-sm text-destructive mt-3">Please enter a valid 6-digit pincode.</p>
            )}
            {pinStatus === "ok" && (
              <p className="text-sm font-medium text-emerald-700 mt-3">Delivery Available</p>
            )}
            {pinStatus === "no" && (
              <p className="text-sm font-medium text-destructive mt-3">Delivery Not Available</p>
            )}
          </div>

          {loading ? (
            <ProductGridSkeleton />
          ) : error ? (
            <ErrorState description={error} onRetry={refetch} />
          ) : (
            <>
              {featured.length > 0 && (
                <ProductSection title="Featured Products" subtitle="Handpicked from the AKM Care catalog">
                  <ProductGrid products={featured} onQuickView={setQuickView} />
                </ProductSection>
              )}

              {newArrivals.length > 0 && (
                <ProductSection title="New Arrivals" subtitle="Latest additions to the collection">
                  <ProductGrid products={newArrivals} onQuickView={setQuickView} />
                </ProductSection>
              )}

              {bestSellers.length > 0 && (
                <ProductSection title="Best Sellers" subtitle="Customer favourites">
                  <ProductGrid products={bestSellers} onQuickView={setQuickView} />
                </ProductSection>
              )}

              <div id="shop-catalog" className="grid lg:grid-cols-[240px_1fr] gap-8 pt-4">
                <div className="hidden lg:block sticky top-24 self-start rounded-2xl border border-black/[0.06] p-4 bg-[#FAF8F5] shadow-sm">
                  <ProductFilters
                    filters={filters}
                    sort={sort}
                    facets={facets}
                    onChange={setFilters}
                    onSortChange={setSort}
                    onReset={() => {
                      setFilters(DEFAULT_FILTERS);
                      setSort("newest");
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="font-heading text-2xl">All Products</h2>
                      <p className="text-sm text-[#6B6B6B]">
                        {total || filtered.length} result{(total || filtered.length) === 1 ? "" : "s"}
                        {offline ? " · offline catalog" : ""}
                      </p>
                    </div>
                    <div className="inline-flex rounded-xl border border-black/[0.08] overflow-hidden bg-white">
                      <button
                        type="button"
                        aria-label="Grid view"
                        onClick={() => setView("grid")}
                        className={cn(
                          "h-10 w-10 flex items-center justify-center",
                          view === "grid" ? "bg-[#E8621A] text-white" : "text-[#6B6B6B] hover:bg-[#FAF8F5]",
                        )}
                      >
                        <LayoutGrid size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="List view"
                        onClick={() => setView("list")}
                        className={cn(
                          "h-10 w-10 flex items-center justify-center",
                          view === "list" ? "bg-[#E8621A] text-white" : "text-[#6B6B6B] hover:bg-[#FAF8F5]",
                        )}
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                  {filtered.length === 0 ? (
                    <EmptyState
                      title="No matches"
                      description="Try clearing filters or searching with a different keyword, product code, or brand."
                    />
                  ) : (
                    <>
                      <ProductGrid products={filtered} onQuickView={setQuickView} view={view} />
                      {hasMore && (
                        <div className="flex justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => void loadMore()}
                            disabled={loadingMore}
                            className="px-6 py-2.5 rounded-full border border-black/[0.08] text-sm font-semibold hover:border-[#E8621A]/40 disabled:opacity-60"
                          >
                            {loadingMore ? "Loading…" : "Load more"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <RecentlyViewedStrip />
            </>
          )}

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setShowNotify(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-all"
            >
              <Bell size={18} /> Notify Me When Available
            </button>
          </div>
        </div>
      </section>

      {showMobileFilters && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/50"
            aria-label="Close filters"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[min(100%,22rem)] bg-white p-5 overflow-y-auto shadow-xl">
            <div className="flex items-center gap-2 mb-4 font-heading text-lg">
              <Filter size={18} /> Filters
            </div>
            <ProductFilters
              filters={filters}
              sort={sort}
              facets={facets}
              onChange={setFilters}
              onSortChange={setSort}
              onReset={() => {
                setFilters(DEFAULT_FILTERS);
                setSort("newest");
              }}
            />
            <button
              type="button"
              className="mt-6 w-full py-3 rounded-full bg-[#E8621A] text-white font-semibold"
              onClick={() => setShowMobileFilters(false)}
            >
              Show {filtered.length} products
            </button>
          </div>
        </div>
      )}

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />

      {showNotify && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/50 flex items-center justify-center p-4"
          onClick={() => setShowNotify(false)}
        >
          <div className="bg-card rounded-2xl p-8 max-w-md w-full card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-2xl mb-2">Get Notified</h3>
            <p className="text-muted-foreground mb-6">
              Enter your email and we&apos;ll let you know when products are available.
            </p>
            <form onSubmit={handleNotify} className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="text"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                placeholder="Product name"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
              >
                Notify Me
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
