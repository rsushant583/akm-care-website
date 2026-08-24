import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, Filter, LayoutGrid, List, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/lib/schemas";
import {
  useCatalogFacets,
  useCatalogMerchandising,
  useCatalogProducts,
} from "@/hooks/useCatalogProducts";
import type { CatalogProduct, ListingViewMode, ShopFilters, SortOption } from "@/lib/ecommerce/types";
import { shopBreadcrumbs } from "@/lib/ecommerce/seo";
import {
  buildShopSearchParams,
  countActiveShopFilters,
  parseShopSearchParams,
  SHOP_SORT_OPTIONS,
} from "@/lib/ecommerce/shopUrlState";
import { useCart } from "@/context/CartContext";
import { submitProductInterest } from "@/lib/submissions";
import { toast } from "@/components/ui/sonner";
import {
  CategoryStrip,
  EmptyState,
  ErrorState,
  PincodeServiceability,
  ProductFilters,
  ProductGrid,
  ProductGridSkeleton,
  ProductSearch,
  ProductRail,
  QuickViewModal,
  RecentlyViewedStrip,
  ShopBreadcrumbs,
  ShopHero,
} from "@/components/shop";
import { cn } from "@/lib/utils";
import { getCategoryLabel } from "@/data/catalog/categories";
import { isProductInStock } from "@/lib/ecommerce/availability";
import { formatINR } from "@/lib/ecommerce/pricing";
import { trackSearch, trackViewItemList } from "@/lib/analytics/events";

function uniqueMerch(list: CatalogProduct[], exclude: Set<string>, min = 2) {
  const out = list.filter((p) => !exclude.has(p.id));
  return out.length >= min ? out : [];
}

type Chip = { key: string; label: string; onRemove: () => void };

export default function Shop() {
  const { itemCount } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  // Stabilize URL parsing — useSearchParams() identity changes every render
  const searchKey = searchParams.toString();
  const { filters, sort, collection } = useMemo(
    () => parseShopSearchParams(new URLSearchParams(searchKey)),
    [searchKey],
  );

  const interestParam = searchParams.get("interest");

  const [view, setView] = useState<ListingViewMode>("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickView, setQuickView] = useState<CatalogProduct | null>(null);
  const [showNotify, setShowNotify] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const commitUrl = useCallback(
    (
      next: { filters: ShopFilters; sort: SortOption; collection?: typeof collection },
      options?: { replace?: boolean },
    ) => {
      const built = buildShopSearchParams({
        filters: next.filters,
        sort: next.sort,
        collection: next.collection === undefined ? collection : next.collection,
        preserve: searchParams,
      });
      if (built.toString() === searchParams.toString()) return;
      setSearchParams(built, { replace: options?.replace ?? false });
    },
    [collection, searchParams, setSearchParams],
  );

  useEffect(() => {
    if (!interestParam) return;
    setSelectedProduct(interestParam);
    setShowNotify(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("interest");
        return next;
      },
      { replace: true },
    );
  }, [interestParam, setSearchParams]);

  // Normalize alias category=3-piece-suit → 3-piece-suits in the address bar
  useEffect(() => {
    if (searchParams.get("category") !== "3-piece-suit") return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("category", "3-piece-suits");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const setCategory = useCallback(
    (id: string) => {
      commitUrl({ filters: { ...filters, category: id }, sort });
    },
    [commitUrl, filters, sort],
  );

  const setQuery = useCallback(
    (q: string) => {
      commitUrl({ filters: { ...filters, query: q }, sort }, { replace: true });
    },
    [commitUrl, filters, sort],
  );

  const setSort = useCallback(
    (next: SortOption) => {
      commitUrl({ filters, sort: next });
    },
    [commitUrl, filters],
  );

  const applyFiltersChange = useCallback(
    (next: ShopFilters) => {
      commitUrl({ filters: next, sort });
    },
    [commitUrl, sort],
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const {
    data: filtered,
    total,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    offline,
    loadMore,
    refetch,
  } = useCatalogProducts({ filters, sort, enablePagination: true, collection });

  const { featured, newArrivals, bestSellers } = useCatalogMerchandising(4);
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

  const categoryLabel = filters.category !== "all" ? getCategoryLabel(filters.category) || filters.category : null;
  const collectionLabel =
    collection === "deals"
      ? "Deals"
      : collection === "featured"
        ? "Featured"
        : collection === "best-sellers"
          ? "Best Sellers"
          : collection === "new-arrivals"
            ? "New Arrivals"
            : null;

  const crumbs = shopBreadcrumbs(
    categoryLabel
      ? [{ name: categoryLabel, url: `/shop?category=${encodeURIComponent(filters.category)}` }]
      : collectionLabel && collection
        ? [{ name: collectionLabel, url: `/shop?collection=${encodeURIComponent(collection)}` }]
        : undefined,
  );

  /** Self-referencing canonical for indexable category views; /shop for collections and filtered search. */
  const shopCanonical = useMemo(() => {
    if (filters.category !== "all" && !collection && !filters.query.trim()) {
      return `/shop?category=${encodeURIComponent(filters.category)}`;
    }
    return "/shop";
  }, [filters.category, collection, filters.query]);

  const catalogIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);
  const showMerchRows =
    !collection && filters.category === "all" && !filters.query.trim() && total > 8;
  const merchFeatured = useMemo(
    () => (showMerchRows ? uniqueMerch(featured, catalogIds) : []),
    [showMerchRows, featured, catalogIds],
  );
  const merchNew = useMemo(() => {
    const exclude = new Set([...catalogIds, ...merchFeatured.map((p) => p.id)]);
    return showMerchRows ? uniqueMerch(newArrivals, exclude) : [];
  }, [showMerchRows, newArrivals, catalogIds, merchFeatured]);
  const merchBest = useMemo(() => {
    const exclude = new Set([
      ...catalogIds,
      ...merchFeatured.map((p) => p.id),
      ...merchNew.map((p) => p.id),
    ]);
    return showMerchRows ? uniqueMerch(bestSellers, exclude) : [];
  }, [showMerchRows, bestSellers, catalogIds, merchFeatured, merchNew]);

  const hasOutOfStock = useMemo(() => filtered.some((p) => !isProductInStock(p)), [filtered]);
  const activeFilterCount = countActiveShopFilters(filters);
  const resultCount = total || filtered.length;
  const heading = collectionLabel || categoryLabel || "All Products";
  const lastListKeyRef = useRef("");

  useEffect(() => {
    if (loading || filtered.length === 0) return;

    let itemListId = "all-products";
    let itemListName = "All Products";
    if (filters.query.trim()) {
      itemListId = "search-results";
      itemListName = "Search Results";
    } else if (collection) {
      itemListId = `collection:${collection}`;
      itemListName = collectionLabel || collection;
    } else if (filters.category !== "all") {
      itemListId = `category:${filters.category}`;
      itemListName = categoryLabel || filters.category;
    }

    const listKey = `${itemListId}|${total}|${filtered.length}`;
    if (lastListKeyRef.current === listKey) return;
    lastListKeyRef.current = listKey;

    trackViewItemList({
      itemListId,
      itemListName,
      products: filtered,
    });
  }, [
    loading,
    filtered,
    total,
    filters.query,
    filters.category,
    collection,
    categoryLabel,
    collectionLabel,
  ]);

  const handleSearchCommit = useCallback((term: string) => {
    trackSearch(term);
  }, []);

  const chips: Chip[] = useMemo(() => {
    const list: Chip[] = [];
    if (filters.query.trim()) {
      list.push({
        key: "q",
        label: `“${filters.query.trim()}”`,
        onRemove: () => commitUrl({ filters: { ...filters, query: "" }, sort }),
      });
    }
    if (filters.category !== "all") {
      list.push({
        key: "category",
        label: categoryLabel || filters.category,
        onRemove: () => commitUrl({ filters: { ...filters, category: "all" }, sort }),
      });
    }
    if (filters.priceMin != null) {
      list.push({
        key: "min",
        label: `Min ${formatINR(filters.priceMin)}`,
        onRemove: () => commitUrl({ filters: { ...filters, priceMin: null }, sort }),
      });
    }
    if (filters.priceMax != null) {
      list.push({
        key: "max",
        label: `Under ${formatINR(filters.priceMax)}`,
        onRemove: () => commitUrl({ filters: { ...filters, priceMax: null }, sort }),
      });
    }
    for (const color of filters.colors) {
      list.push({
        key: `color-${color}`,
        label: color,
        onRemove: () =>
          commitUrl({
            filters: { ...filters, colors: filters.colors.filter((c) => c !== color) },
            sort,
          }),
      });
    }
    for (const variant of filters.variants) {
      list.push({
        key: `variant-${variant}`,
        label: variant,
        onRemove: () =>
          commitUrl({
            filters: { ...filters, variants: filters.variants.filter((v) => v !== variant) },
            sort,
          }),
      });
    }
    if (filters.availability === "in_stock") {
      list.push({
        key: "avail",
        label: "In stock",
        onRemove: () => commitUrl({ filters: { ...filters, availability: "all" }, sort }),
      });
    }
    if (filters.availability === "out_of_stock") {
      list.push({
        key: "avail",
        label: "Out of stock",
        onRemove: () => commitUrl({ filters: { ...filters, availability: "all" }, sort }),
      });
    }
    if (collectionLabel) {
      list.push({
        key: "collection",
        label: collectionLabel,
        onRemove: () => commitUrl({ filters, sort, collection: null }),
      });
    }
    return list;
  }, [filters, sort, categoryLabel, collectionLabel, commitUrl]);

  const emptyTitle =
    filters.category !== "all" &&
    !filters.query.trim() &&
    filters.colors.length === 0 &&
    filters.variants.length === 0 &&
    filters.priceMin == null &&
    filters.priceMax == null &&
    filters.availability === "all"
      ? `No products in ${categoryLabel || "this category"} yet`
      : "No products found";

  const emptyDescription =
    filters.category !== "all" &&
    !filters.query.trim() &&
    activeFilterCount <= 1
      ? "Products for this category will appear here as they are added to the catalog."
      : "Try adjusting filters or search to discover more AKM Care products.";

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
        title={
          collectionLabel
            ? `${collectionLabel} — Shop`
            : categoryLabel
              ? `${categoryLabel} — Shop`
              : "Shop — Sarees, Lehengas, Gowns, Suits & Jeans"
        }
        description="Shop authentic fashion online — sarees, lehengas, gowns, 3-piece suits and men's jeans. Live pricing and stock, delivered pan-India by AKM Care."
        keywords="buy sarees online, lehenga, ladies gown, 3 piece suit, mens jeans, AKM Care shop"
        canonical={shopCanonical}
        schema={breadcrumbSchema(crumbs)}
      />

      <ShopHero />

      <section className="section-padding bg-white pt-4">
        <div className="container-premium space-y-8">
          <ShopBreadcrumbs items={crumbs} />

          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <CategoryStrip active={filters.category} onSelect={setCategory} />
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <ProductSearch
                value={filters.query}
                onChange={setQuery}
                onSearchCommit={handleSearchCommit}
                className="flex-1 lg:w-80"
              />
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 px-3 py-3 min-h-11 bg-[#E8621A] text-white text-sm font-semibold"
              >
                <ShoppingCart size={16} aria-hidden />
                <span className="hidden sm:inline">Cart</span> ({itemCount})
              </Link>
            </div>
          </div>

          {error && filtered.length === 0 ? (
            <ErrorState description="Unable to load products right now. Please try again." onRetry={refetch} />
          ) : (
            <>
              {merchFeatured.length > 0 && (
                <ProductRail
                  title="Featured Products"
                  subtitle="Handpicked from the AKM Care catalog"
                  products={merchFeatured}
                  onQuickView={setQuickView}
                  minItems={1}
                  ctaLabel="Shop all"
                  ctaHref="/shop?collection=featured"
                />
              )}

              {merchNew.length > 0 && (
                <ProductRail
                  title="New Arrivals"
                  subtitle="Latest additions to the collection"
                  products={merchNew}
                  onQuickView={setQuickView}
                  minItems={1}
                  ctaLabel="See all"
                  ctaHref="/shop?collection=new-arrivals"
                />
              )}

              {merchBest.length > 0 && (
                <ProductRail
                  title="Best Sellers"
                  subtitle="Marked as bestsellers in the catalog"
                  products={merchBest}
                  onQuickView={setQuickView}
                  minItems={1}
                  ctaLabel="See all"
                  ctaHref="/shop?collection=best-sellers"
                />
              )}

              <div id="shop-catalog" className="grid lg:grid-cols-[260px_1fr] gap-8 pt-2">
                <div className="hidden lg:block sticky top-24 self-start ring-1 ring-black/[0.06] p-4 bg-[#FAF8F5]">
                  <ProductFilters
                    filters={filters}
                    sort={sort}
                    facets={facets}
                    onChange={applyFiltersChange}
                    onSortChange={setSort}
                    onReset={resetFilters}
                    idPrefix="shop-filter-desktop"
                  />
                </div>

                <div className="space-y-4">
                  <div className="lg:hidden sticky top-14 z-30 -mx-4 px-4 py-2.5 bg-white/95 backdrop-blur-md border-y border-black/[0.06] flex items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums flex-1" aria-live="polite">
                      {loading && filtered.length === 0
                        ? "Loading…"
                        : `${resultCount} ${resultCount === 1 ? "product" : "products"}`}
                    </p>
                    <label className="sr-only" htmlFor="shop-mobile-sort">
                      Sort products
                    </label>
                    <select
                      id="shop-mobile-sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="min-h-10 px-2.5 py-2 border border-black/[0.08] bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
                    >
                      {SHOP_SORT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="relative inline-flex items-center gap-1.5 min-h-10 px-3 py-2 border border-black/[0.08] text-sm font-semibold"
                      onClick={() => setShowMobileFilters(true)}
                      aria-expanded={showMobileFilters}
                      aria-controls="shop-mobile-filters"
                    >
                      <SlidersHorizontal size={16} aria-hidden />
                      Filter
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-[#E8621A] text-white text-[10px] font-bold flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1">Shop</p>
                      <h1 className="font-heading text-2xl sm:text-3xl text-[#1A1A1A]">{heading}</h1>
                      <p className="text-sm text-[#6B6B6B] mt-1" aria-live="polite">
                        {loading && filtered.length === 0
                          ? "Loading products…"
                          : `${resultCount} ${resultCount === 1 ? "product" : "products"}`}
                        {offline ? " · offline catalog" : ""}
                        {refreshing ? " · updating" : ""}
                      </p>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 flex-wrap">
                      <label className="sr-only" htmlFor="shop-toolbar-sort">
                        Sort products
                      </label>
                      <select
                        id="shop-toolbar-sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortOption)}
                        className="px-3 py-2.5 rounded-xl border border-black/[0.08] bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
                      >
                        {SHOP_SORT_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="inline-flex rounded-xl border border-black/[0.08] overflow-hidden bg-white">
                        <button
                          type="button"
                          aria-label="Grid view"
                          aria-pressed={view === "grid"}
                          onClick={() => setView("grid")}
                          className={cn(
                            "h-10 w-10 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8621A]/40",
                            view === "grid" ? "bg-[#E8621A] text-white" : "text-[#6B6B6B] hover:bg-[#FAF8F5]",
                          )}
                        >
                          <LayoutGrid size={16} aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="List view"
                          aria-pressed={view === "list"}
                          onClick={() => setView("list")}
                          className={cn(
                            "h-10 w-10 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8621A]/40",
                            view === "list" ? "bg-[#E8621A] text-white" : "text-[#6B6B6B] hover:bg-[#FAF8F5]",
                          )}
                        >
                          <List size={16} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>

                  {chips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
                      {chips.map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={chip.onRemove}
                          className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-black/[0.08] bg-white text-xs font-semibold text-[#1A1A1A] hover:border-[#E8621A]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
                        >
                          {chip.label}
                          <X size={12} aria-hidden />
                          <span className="sr-only">Remove {chip.label}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-semibold text-[#E8621A] hover:underline px-1"
                      >
                        Clear all
                      </button>
                    </div>
                  )}

                  {loading && filtered.length === 0 ? (
                    <ProductGridSkeleton />
                  ) : (
                    <div aria-busy={refreshing} className={refreshing ? "opacity-80 motion-safe:transition-opacity" : undefined}>
                      <ProductGrid
                        products={filtered}
                        onQuickView={setQuickView}
                        view={view}
                        emptyTitle={emptyTitle}
                        emptyDescription={emptyDescription}
                        onClearFilters={activeFilterCount > 0 ? resetFilters : undefined}
                      />
                    </div>
                  )}
                  {hasMore && filtered.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        onClick={() => void loadMore()}
                        disabled={loadingMore}
                        className="px-6 py-2.5 rounded-full border border-black/[0.08] text-sm font-semibold hover:border-[#E8621A]/40 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
                      >
                        {loadingMore ? "Loading…" : "Load more"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <PincodeServiceability variant="card" />

              <RecentlyViewedStrip />
            </>
          )}

          {hasOutOfStock && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowNotify(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-all"
              >
                <Bell size={18} aria-hidden /> Notify Me When Available
              </button>
            </div>
          )}
        </div>
      </section>

      {showMobileFilters && (
        <div className="fixed inset-0 z-[110] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="shop-mobile-filters-title">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/50"
            aria-label="Close filters"
            onClick={() => setShowMobileFilters(false)}
          />
          <div
            id="shop-mobile-filters"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl bg-white shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2 font-heading text-lg" id="shop-mobile-filters-title">
                <Filter size={18} aria-hidden /> Filters & sort
              </div>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setShowMobileFilters(false)}
                className="h-10 w-10 rounded-full border border-black/10 flex items-center justify-center text-[#6B6B6B]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">
              <ProductFilters
                filters={filters}
                sort={sort}
                facets={facets}
                onChange={applyFiltersChange}
                onSortChange={setSort}
                onReset={resetFilters}
                idPrefix="shop-filter-mobile"
              />
            </div>
            <div className="p-4 border-t border-black/[0.06] safe-area-pb">
              <button
                type="button"
                className="w-full py-3 rounded-full bg-[#E8621A] text-white font-semibold"
                onClick={() => setShowMobileFilters(false)}
              >
                Show {resultCount} products
              </button>
            </div>
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
