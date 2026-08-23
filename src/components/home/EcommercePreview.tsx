import { useEffect, useMemo } from "react";
import { useCatalogMerchandising, useCatalogProducts } from "@/hooks/useCatalogProducts";
import { ProductRail, RecentlyViewedStrip } from "@/components/shop";
import Hero from "@/components/home/Hero";
import HomeCategoryStrip from "@/components/home/HomeCategoryStrip";
import TrustStrip from "@/components/home/TrustStrip";
import CollectionBanner from "@/components/home/CollectionBanner";
import {
  pickCategoryImages,
  pickHeroTiles,
  buildHeroCategoryCollages,
  getHeroCategoryAssetSummary,
  uniqueProducts,
} from "@/lib/ecommerce/merchandising";
import { shopCollectionPath } from "@/data/catalog/categories";

const MIN_SECTION = 2;

/** Homepage catalog — same catalog SoT as Shop; hide empty / duplicate merch rows. */
export default function EcommercePreview() {
  const { featured, bestSellers, deals, newArrivals, loading: merchLoading } = useCatalogMerchandising(8);
  const { data: catalogPreview, loading: catalogLoading } = useCatalogProducts({
    pageSize: 48,
    enablePagination: false,
  });

  const loading = merchLoading || catalogLoading;

  const pool = useMemo(
    () => uniqueProducts([catalogPreview, featured, newArrivals, deals, bestSellers]),
    [catalogPreview, featured, newArrivals, deals, bestSellers],
  );

  const categoryImages = useMemo(() => pickCategoryImages(pool), [pool]);

  const primary = useMemo(() => {
    if (featured.length > 0) return featured.slice(0, 8);
    return catalogPreview.slice(0, 8);
  }, [featured, catalogPreview]);

  const heroTiles = useMemo(
    () => pickHeroTiles([...featured, ...catalogPreview, ...newArrivals], 3),
    [featured, catalogPreview, newArrivals],
  );

  const heroCollages = useMemo(() => buildHeroCategoryCollages(pool, 3), [pool]);

  useEffect(() => {
    if (!import.meta.env.DEV || pool.length === 0) return;
    // One-shot local debug of category eligibility — omitted from production runtime path.
    console.info(
      "[hero-category-assets]",
      getHeroCategoryAssetSummary(pool).map(
        (row) => `${row.categoryId} → ${row.assetCount} asset(s) → ${row.eligible ? "eligible" : "skipped"}`,
      ),
    );
  }, [pool]);

  const primaryIds = useMemo(() => new Set(primary.map((p) => p.id)), [primary]);

  const uniqueDeals = useMemo(
    () => uniqueProducts([deals], primaryIds).slice(0, 8),
    [deals, primaryIds],
  );
  const uniqueNew = useMemo(
    () => uniqueProducts([newArrivals], new Set([...primaryIds, ...uniqueDeals.map((p) => p.id)])).slice(0, 8),
    [newArrivals, primaryIds, uniqueDeals],
  );
  const uniqueBest = useMemo(() => {
    const exclude = new Set([
      ...primaryIds,
      ...uniqueDeals.map((p) => p.id),
      ...uniqueNew.map((p) => p.id),
    ]);
    return uniqueProducts([bestSellers], exclude).slice(0, 8);
  }, [bestSellers, primaryIds, uniqueDeals, uniqueNew]);

  const catalogIsTiny = catalogPreview.length > 0 && catalogPreview.length <= 8;
  const allowExtraMerch = !catalogIsTiny || featured.length > 0;

  const showDeals = allowExtraMerch && uniqueDeals.length >= MIN_SECTION;
  const showNew = allowExtraMerch && uniqueNew.length >= MIN_SECTION;
  const showBest = allowExtraMerch && uniqueBest.length >= MIN_SECTION;
  const bannerImage = uniqueDeals[0]?.images[0]?.src || uniqueDeals[0]?.image_url;

  return (
    <div>
      <Hero tiles={heroTiles} collages={heroCollages} />
      <HomeCategoryStrip images={categoryImages} />
      <TrustStrip />

      <div className="bg-[#FAF8F5] home-section">
        <div className="container-premium">
          <ProductRail
            id="featured-products"
            eyebrow="Featured"
            title={featured.length > 0 ? "Handpicked for you" : "Shop our products"}
            products={primary}
            loading={loading}
            minItems={1}
            ctaLabel="Shop all"
            ctaHref="/shop"
            emptyLabel="Products will appear here once published in Admin."
          />
        </div>
      </div>

      {showDeals && (
        <div className="bg-white home-section">
          <div className="container-premium">
            <ProductRail
              id="deals"
              eyebrow="Offers"
              title="Deals & discounts"
              products={uniqueDeals}
              ctaLabel="See all"
              ctaHref={shopCollectionPath("deals")}
            />
          </div>
        </div>
      )}

      {showNew && (
        <div className="bg-[#FAF8F5] home-section">
          <div className="container-premium">
            <ProductRail
              id="new-arrivals"
              eyebrow="Just in"
              title="New arrivals"
              products={uniqueNew}
              ctaLabel="See all"
              ctaHref={shopCollectionPath("new-arrivals")}
            />
          </div>
        </div>
      )}

      {showBest && (
        <div className="bg-white home-section">
          <div className="container-premium">
            <ProductRail
              id="best-sellers"
              eyebrow="Bestsellers"
              title="Customer favourites"
              products={uniqueBest}
              ctaLabel="See all"
              ctaHref={shopCollectionPath("best-sellers")}
            />
          </div>
        </div>
      )}

      {showDeals && (
        <CollectionBanner
          eyebrow="Collection"
          title="Seasonal deals"
          description="Shop discounted sarees, lehengas and more from the current catalog."
          href={shopCollectionPath("deals")}
          ctaLabel="Browse deals"
          imageSrc={bannerImage}
          imageAlt={uniqueDeals[0]?.name}
        />
      )}

      <div className="bg-white">
        <div className="container-premium">
          <RecentlyViewedStrip className="home-section" />
        </div>
      </div>
    </div>
  );
}
