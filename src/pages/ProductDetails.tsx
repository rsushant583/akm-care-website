import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  Zap,
  Share2,
  GitCompare,
  RotateCcw,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/lib/schemas";
import { useCatalogProduct } from "@/hooks/useCatalogProduct";
import { useRelatedCatalogProducts } from "@/hooks/useCatalogProducts";
import { productSeo, shopBreadcrumbs } from "@/lib/ecommerce/seo";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { shareProduct } from "@/lib/ecommerce/share";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import {
  EmptyState,
  ErrorState,
  ProductGallery,
  ProductGridSkeleton,
  RecentlyViewedStrip,
  RelatedProducts,
  ShopBreadcrumbs,
  StickyBuyBar,
} from "@/components/shop";
import { cn } from "@/lib/utils";

export default function ProductDetails() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { product, loading, error, refetch } = useCatalogProduct(slug);
  const related = useRelatedCatalogProducts(product?.id, 4);
  const { addToCart, buyNowLine } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();
  const { track } = useRecentlyViewed();

  const [qty, setQty] = useState(1);
  const [colorId, setColorId] = useState<string | undefined>();
  const [variantId, setVariantId] = useState<string | undefined>();
  const [showSticky, setShowSticky] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) track(product);
  }, [product, track]);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product?.id]);

  const selectedColor = useMemo(
    () => product?.colors.find((c) => c.id === (colorId ?? product.colors[0]?.id)),
    [product, colorId],
  );
  const selectedVariant = useMemo(
    () => product?.variants.find((v) => v.id === (variantId ?? product.variants[0]?.id)),
    [product, variantId],
  );

  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (selectedColor?.imageIndexes?.length) {
      return selectedColor.imageIndexes.map((i) => product.images[i]).filter(Boolean);
    }
    return product.images;
  }, [product, selectedColor]);

  if (loading) {
    return (
      <section className="section-padding bg-white">
        <div className="container-premium">
          <ProductGridSkeleton count={2} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-padding bg-white">
        <div className="container-premium">
          <ErrorState description={error} onRetry={refetch} />
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section-padding bg-white">
        <div className="container-premium">
          <EmptyState
            title="Product not found"
            description="This product may have been moved or is no longer listed."
            actionLabel="Back to Shop"
            actionHref="/shop"
          />
        </div>
      </section>
    );
  }

  const price = getEffectivePrice(product);
  const savings = Math.max(0, product.mrp - price);
  const inStock = product.stock_quantity > 0;
  const seo = productSeo(product);
  const crumbs = shopBreadcrumbs([
    { name: product.categoryLabel, url: `/shop?category=${product.category}` },
    { name: product.name, url: seo.canonical },
  ]);

  const selection = {
    product,
    quantity: qty,
    colorId: selectedColor?.id,
    colorName: selectedColor?.name,
    variantId: selectedVariant?.id,
    variantName: selectedVariant?.name,
  };

  return (
    <>
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={seo.canonical}
        ogImage={seo.ogImage}
        ogType={seo.ogType}
        schema={[seo.schema, breadcrumbSchema(crumbs)]}
      />

      <section className="section-padding bg-white pt-6">
        <div className="container-premium">
          <ShopBreadcrumbs items={crumbs} className="mb-6" />

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <ProductGallery
              images={galleryImages.length ? galleryImages : product.images}
              productName={product.name}
            />

            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#E8621A]">
                  {product.brand || "AKM Care"} · {product.categoryLabel}
                </p>
                <h1 className="font-heading text-3xl sm:text-4xl text-[#1A1A1A] mt-1">{product.name}</h1>
                <p className="text-[#6B6B6B] mt-2">{product.shortDescription}</p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span>{(product.rating ?? 4.5).toFixed(1)}</span>
                <span className="text-[#6B6B6B]">· Reviews coming soon</span>
                <span
                  className={cn(
                    "ml-auto text-xs font-semibold px-2 py-1 rounded-full",
                    inStock ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              <div className="rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-4 space-y-2">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-semibold text-[#E8621A]">{formatINR(price)}</span>
                  {product.mrp > price && (
                    <span className="text-lg text-[#6B6B6B] line-through">{formatINR(product.mrp)}</span>
                  )}
                  {product.discountPercent > 0 && (
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-[#E8621A]/10 text-[#E8621A]">
                      {product.discountPercent}% OFF
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-sm text-emerald-700 font-medium">
                    You save {formatINR(savings)} (AKM Care Price)
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs text-[#6B6B6B] pt-1">
                  <p>
                    SKU: <span className="text-[#1A1A1A] font-medium">{product.sku}</span>
                  </p>
                  <p>
                    HSN: <span className="text-[#1A1A1A] font-medium">{product.hsn || "—"}</span>
                  </p>
                  <p>
                    GST: <span className="text-[#1A1A1A] font-medium">{product.gstPercent}%</span>
                  </p>
                  <p>
                    Code: <span className="text-[#1A1A1A] font-medium">{product.productCode}</span>
                  </p>
                </div>
              </div>

              {product.colors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Color: <span className="font-normal text-[#6B6B6B]">{selectedColor?.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.name}
                        onClick={() => setColorId(c.id)}
                        className={cn(
                          "h-9 w-9 rounded-full border-2",
                          (colorId ?? product.colors[0]?.id) === c.id
                            ? "border-[#E8621A] ring-2 ring-[#E8621A]/25"
                            : "border-black/10",
                        )}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.variants.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Variant</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium border",
                          (variantId ?? product.variants[0]?.id) === v.id
                            ? "border-[#E8621A] bg-[#E8621A]/10 text-[#E8621A]"
                            : "border-black/10 text-[#6B6B6B]",
                        )}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">Quantity</p>
                <div className="inline-flex items-center gap-3 rounded-full border border-black/10 px-2 py-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/[0.04]"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => Math.min(product.stock_quantity || 10, q + 1))}
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/[0.04]"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-xs text-[#6B6B6B] mt-2">
                  {inStock ? `${product.stock_quantity} available` : "Currently out of stock"}
                </p>
              </div>

              <div ref={actionsRef} className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => addToCart(selection)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#E8621A] text-white font-semibold disabled:opacity-50 shadow-md shadow-[#E8621A]/20"
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => {
                    buyNowLine(selection);
                    navigate("/checkout");
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#1A1A1A] text-white font-semibold disabled:opacity-50"
                >
                  <Zap size={18} /> Buy Now
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id, product.name)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-black/10 font-semibold"
                >
                  <Heart
                    size={18}
                    className="text-[#E8621A]"
                    fill={isWishlisted(product.id) ? "currentColor" : "none"}
                  />
                  Wishlist
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompare(product)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-3 rounded-full border font-semibold",
                    isCompared(product.id)
                      ? "border-[#E8621A]/40 text-[#E8621A] bg-[#E8621A]/5"
                      : "border-black/10",
                  )}
                >
                  <GitCompare size={18} /> Compare
                </button>
                <button
                  type="button"
                  onClick={() => void shareProduct({ name: product.name, slug: product.slug })}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full border border-black/10 font-semibold"
                >
                  <Share2 size={18} /> Share
                </button>
              </div>

              <div className="hidden lg:flex sticky bottom-4 z-10 gap-3 rounded-2xl border border-black/10 bg-white/95 backdrop-blur-md p-3 shadow-lg">
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => addToCart(selection)}
                  className="flex-1 py-3 rounded-full bg-[#E8621A] text-white font-semibold disabled:opacity-50"
                >
                  Add to Cart · {formatINR(price)}
                </button>
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => {
                    buyNowLine(selection);
                    navigate("/checkout");
                  }}
                  className="flex-1 py-3 rounded-full bg-[#1A1A1A] text-white font-semibold disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-black/[0.06] p-3 flex gap-3">
                  <Truck className="text-[#E8621A] shrink-0" size={20} />
                  <div>
                    <p className="font-semibold">Shipping Estimate</p>
                    <p className="text-[#6B6B6B] text-xs mt-0.5">{product.shippingTime}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-black/[0.06] p-3 flex gap-3">
                  <ShieldCheck className="text-[#E8621A] shrink-0" size={20} />
                  <div>
                    <p className="font-semibold">Warranty</p>
                    <p className="text-[#6B6B6B] text-xs mt-0.5">{product.warranty}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-black/[0.06] p-3 flex gap-3">
                  <RotateCcw className="text-[#E8621A] shrink-0" size={20} />
                  <div>
                    <p className="font-semibold">Return Policy</p>
                    <p className="text-[#6B6B6B] text-xs mt-0.5">
                      {product.returnPolicy || "7 days return — unused with original packing"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="font-heading text-xl mb-3">Product Description</h2>
              <p className="text-[#6B6B6B] leading-relaxed whitespace-pre-line">{product.detailedDescription}</p>
            </div>
            <div>
              <h2 className="font-heading text-xl mb-3">Specifications</h2>
              <dl className="rounded-2xl border border-black/[0.06] divide-y divide-black/[0.06] text-sm shadow-sm">
                {[
                  ["Brand", product.brand || "AKM Care"],
                  ["Category", product.categoryLabel],
                  ["SKU", product.sku],
                  ["Product Code", product.productCode],
                  ["Dimensions", product.dimensions],
                  ["Weight", product.weight || "—"],
                  ["Packing", product.packingType || "—"],
                  ["Variant", selectedVariant?.name || "—"],
                  ["Colors available", String(product.colors.length || "—")],
                  ["GST %", `${product.gstPercent}%`],
                  ["GSTIN", product.gstNumber || "—"],
                  ["HSN", product.hsn || "—"],
                  ["Freight", product.freightCost || "Calculated at checkout"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-[#6B6B6B]">{k}</dt>
                    <dd className="font-medium text-[#1A1A1A] text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <RelatedProducts products={related} currentId={product.id} />
          <RecentlyViewedStrip excludeId={product.id} />

          <p className="text-center text-sm text-[#6B6B6B] mt-8 pb-16 lg:pb-0">
            <Link to="/shop" className="text-[#E8621A] font-semibold hover:underline">
              ← Back to Shop
            </Link>
          </p>
        </div>
      </section>

      <StickyBuyBar
        visible={showSticky}
        price={price}
        inStock={inStock}
        productName={product.name}
        onAdd={() => addToCart(selection)}
        onBuy={() => {
          buyNowLine(selection);
          navigate("/checkout");
        }}
      />
    </>
  );
}
