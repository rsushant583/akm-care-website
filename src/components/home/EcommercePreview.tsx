import { useEffect, useMemo, useRef } from "react";
import { useCatalogMerchandising, useCatalogProducts } from "@/hooks/useCatalogProducts";
import { ProductRail, RecentlyViewedStrip } from "@/components/shop";
import Hero from "@/components/home/Hero";
import HomeCategoryStrip from "@/components/home/HomeCategoryStrip";
import TrustStrip from "@/components/home/TrustStrip";
import CollectionBanner from "@/components/home/CollectionBanner";
import {
  HOME_CATEGORY_RAIL_SPECS,
  pickCategoryImages,
  pickCategoryRailProducts,
  pickLatestSpotlightProducts,
  pickNewestArrivals,
  uniqueProducts,
} from "@/lib/ecommerce/merchandising";
import { shopCollectionPath } from "@/data/catalog/categories";
import { trackNewArrivalsView } from "@/lib/analytics/events";

const RAIL_LIMIT = 8;
const SPOTLIGHT_LIMIT = 8;
const MIN_SECTION = 2;

/** Homepage catalog — same catalog SoT as Shop; hide empty / duplicate merch rows. */
export default function EcommercePreview() {
  const { featured, bestSellers, deals, loading: merchLoading } = useCatalogMerchandising(RAIL_LIMIT);
  const { data: catalogPreview, loading: catalogLoading } = useCatalogProducts({
    pageSize: 24,
    enablePagination: false,
  });

  const loading = merchLoading || catalogLoading;
  const newArrivalsViewed = useRef(false);

  const pool = useMemo(
    () => uniqueProducts([catalogPreview, featured, deals, bestSellers]),
    [catalogPreview, featured, deals, bestSellers],
  );

  const spotlightProducts = useMemo(() => {
    const fromLatest = pickLatestSpotlightProducts(pool, SPOTLIGHT_LIMIT);
    if (fromLatest.length > 0) return fromLatest;
    return pickLatestSpotlightProducts(featured, SPOTLIGHT_LIMIT);
  }, [pool, featured]);

  const newestArrivals = useMemo(
    () => pickNewestArrivals(pool.length > 0 ? pool : catalogPreview, RAIL_LIMIT),
    [pool, catalogPreview],
  );

  const categoryImages = useMemo(() => pickCategoryImages(pool), [pool]);

  const primary = useMemo(() => {
    if (featured.length > 0) return featured.slice(0, RAIL_LIMIT);
    return pickNewestArrivals(catalogPreview, RAIL_LIMIT);
  }, [featured, catalogPreview]);

  const primaryIds = useMemo(() => new Set(primary.map((p) => p.id)), [primary]);
  const newIds = useMemo(() => new Set(newestArrivals.map((p) => p.id)), [newestArrivals]);

  const uniqueDeals = useMemo(
    () => uniqueProducts([deals], new Set([...primaryIds, ...newIds])).slice(0, RAIL_LIMIT),
    [deals, primaryIds, newIds],
  );

  const uniqueBest = useMemo(() => {
    const exclude = new Set([
      ...primaryIds,
      ...newIds,
      ...uniqueDeals.map((p) => p.id),
    ]);
    return uniqueProducts([bestSellers], exclude).slice(0, RAIL_LIMIT);
  }, [bestSellers, primaryIds, newIds, uniqueDeals]);

  const catalogIsTiny = pool.length > 0 && pool.length <= 8;
  const allowExtraMerch = !catalogIsTiny || featured.length > 0 || newestArrivals.length >= MIN_SECTION;

  const showNew = newestArrivals.length >= MIN_SECTION || (!loading && newestArrivals.length >= 1 && pool.length <= 4);
  const showFeatured = primary.length >= 1;
  const showDeals = allowExtraMerch && uniqueDeals.length >= MIN_SECTION;
  const showBest = allowExtraMerch && uniqueBest.length >= MIN_SECTION;

  // Category rails: only when they add discovery beyond New Arrivals + Featured (small catalogs skip)
  const categoryRails = useMemo(() => {
    if (catalogIsTiny && pool.length < 6) return [];
    const used = new Set<string>([...newIds, ...primaryIds]);
    const rails: { spec: (typeof HOME_CATEGORY_RAIL_SPECS)[number]; products: typeof newestArrivals }[] = [];
    for (const spec of HOME_CATEGORY_RAIL_SPECS) {
      const products = pickCategoryRailProducts(pool, spec.categoryIds, RAIL_LIMIT, used, MIN_SECTION);
      if (products.length < MIN_SECTION) continue;
      products.forEach((p) => used.add(p.id));
      rails.push({ spec, products });
    }
    return rails;
  }, [catalogIsTiny, pool, newIds, primaryIds]);

  const bannerImage = uniqueDeals[0]?.images[0]?.src || uniqueDeals[0]?.image_url;

  useEffect(() => {
    if (newArrivalsViewed.current || newestArrivals.length === 0) return;
    newArrivalsViewed.current = true;
    trackNewArrivalsView(newestArrivals);
  }, [newestArrivals]);

  return (
    <div>
      <Hero products={spotlightProducts} loading={loading} />

      {showNew ? (
        <div className="bg-[#FAF8F5] home-section">
          <div className="container-premium">
            <ProductRail
              id="new-arrivals"
              eyebrow="Just in"
              title="New arrivals"
              products={newestArrivals}
              loading={loading}
              minItems={1}
              priorityCount={4}
              ctaLabel="See all"
              ctaHref={shopCollectionPath("new-arrivals")}
              itemListId="home_new_arrivals"
              itemListName="New arrivals"
              emptyLabel="Products will appear here once published in Admin."
            />
          </div>
        </div>
      ) : null}

      <HomeCategoryStrip images={categoryImages} />

      {showFeatured ? (
        <div className="bg-white home-section">
          <div className="container-premium">
            <ProductRail
              id="featured-products"
              eyebrow="Featured"
              title={featured.length > 0 ? "Handpicked for you" : "Shop our products"}
              products={primary}
              loading={loading}
              minItems={1}
              priorityCount={0}
              ctaLabel="Shop all"
              ctaHref="/shop"
              itemListId="home_featured"
              itemListName="Featured"
              emptyLabel="Products will appear here once published in Admin."
            />
          </div>
        </div>
      ) : null}

      {categoryRails.map(({ spec, products }) => (
        <div key={spec.id} className="bg-[#FAF8F5] home-section">
          <div className="container-premium">
            <ProductRail
              id={`category-${spec.id}`}
              eyebrow="Collection"
              title={spec.title}
              products={products}
              minItems={MIN_SECTION}
              priorityCount={0}
              ctaLabel="See all"
              ctaHref={spec.href}
              itemListId={`home_category_${spec.id}`}
              itemListName={spec.title}
            />
          </div>
        </div>
      ))}

      {showDeals ? (
        <div className="bg-white home-section">
          <div className="container-premium">
            <ProductRail
              id="deals"
              eyebrow="Offers"
              title="Deals & discounts"
              products={uniqueDeals}
              priorityCount={0}
              ctaLabel="See all"
              ctaHref={shopCollectionPath("deals")}
              itemListId="home_deals"
              itemListName="Deals"
            />
          </div>
        </div>
      ) : null}

      {showBest ? (
        <div className="bg-[#FAF8F5] home-section">
          <div className="container-premium">
            <ProductRail
              id="best-sellers"
              eyebrow="Bestsellers"
              title="Customer favourites"
              products={uniqueBest}
              priorityCount={0}
              ctaLabel="See all"
              ctaHref={shopCollectionPath("best-sellers")}
              itemListId="home_best_sellers"
              itemListName="Best sellers"
            />
          </div>
        </div>
      ) : null}

      {showDeals ? (
        <CollectionBanner
          eyebrow="Collection"
          title="Seasonal deals"
          description="Shop discounted sarees, lehengas and more from the current catalog."
          href={shopCollectionPath("deals")}
          ctaLabel="Browse deals"
          imageSrc={bannerImage}
          imageAlt={uniqueDeals[0]?.name}
        />
      ) : null}

      <TrustStrip />

      <div className="bg-white">
        <div className="container-premium">
          <RecentlyViewedStrip className="home-section" />
        </div>
      </div>
    </div>
  );
}
