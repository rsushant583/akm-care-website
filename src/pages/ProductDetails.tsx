import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  Check,
  GitCompare,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema, faqSchema } from "@/lib/schemas";
import { useCatalogProduct } from "@/hooks/useCatalogProduct";
import { useRelatedCatalogProducts } from "@/hooks/useCatalogProducts";
import { productSeo, shopBreadcrumbs } from "@/lib/ecommerce/seo";
import { formatProductShippingCopy } from "@/lib/ecommerce/shippingPolicy";
import { formatINR, getEffectivePrice, displayDiscountPercent } from "@/lib/ecommerce/pricing";
import { getAvailableQuantity, isProductInStock } from "@/lib/ecommerce/availability";
import { getStockLabel } from "@/lib/ecommerce/badges";
import { customerSafeMessage } from "@/lib/ecommerce/customerCopy";
import { shareProduct } from "@/lib/ecommerce/share";
import { isValidIndianPincode, mockDeliveryAvailable } from "@/lib/pincodeDelivery";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import {
  EmptyState,
  ErrorState,
  ProductGallery,
  ProductPdpSkeleton,
  RecentlyViewedStrip,
  RelatedProducts,
  ShopBreadcrumbs,
  StickyBuyBar,
} from "@/components/shop";
import { cn } from "@/lib/utils";
import { trackViewItem } from "@/lib/analytics/events";

function isMeaningful(value?: string | number | null): boolean {
  if (value == null) return false;
  const t = String(value).trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  return !(
    lower === "na" ||
    lower === "n/a" ||
    lower === "—" ||
    lower === "-" ||
    lower === "null" ||
    lower === "undefined"
  );
}

function displayWarranty(raw?: string | null): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower === "na" || lower === "n/a") return "No warranty";
  return t;
}

export default function ProductDetails() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { product, loading, error, refetch } = useCatalogProduct(slug);
  const related = useRelatedCatalogProducts(product?.id, 8);
  const { addToCart, buyNowLine } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();
  const { track } = useRecentlyViewed();

  const [qty, setQty] = useState(1);
  const [colorId, setColorId] = useState<string | undefined>();
  const [variantId, setVariantId] = useState<string | undefined>();
  const [showSticky, setShowSticky] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinStatus, setPinStatus] = useState<"idle" | "invalid" | "ok" | "no">("idle");
  const [openSection, setOpenSection] = useState<"shipping" | "returns" | "warranty" | null>("shipping");
  const actionsRef = useRef<HTMLDivElement>(null);
  const addLockRef = useRef(false);
  const viewedProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (product) track(product);
  }, [product, track]);

  useEffect(() => {
    if (!product || loading || error) return;
    if (viewedProductIdRef.current === product.id) return;
    viewedProductIdRef.current = product.id;
    trackViewItem(product);
  }, [product, loading, error]);

  useEffect(() => {
    setQty(1);
    setColorId(undefined);
    setVariantId(undefined);
    setJustAdded(false);
    setPinStatus("idle");
  }, [product?.id]);

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
          <ProductPdpSkeleton />
        </div>
      </section>
    );
  }

  if (error && !product) {
    return (
      <>
        <SEO
          title="Unable to load product"
          description="This AKM Care product could not be loaded right now. Please try again or return to the shop."
          robots="noindex, follow"
          omitCanonical
        />
      <section className="section-padding bg-white">
        <div className="container-premium">
          <ErrorState description={customerSafeMessage(error, "Unable to load this product right now.")} onRetry={refetch} />
          <p className="text-center mt-6">
            <Link to="/shop" className="text-[#E8621A] font-semibold hover:underline">
              Back to the AKM Care shop
            </Link>
          </p>
        </div>
      </section>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <SEO
          title="Product not found"
          description="This product may have been moved or is no longer listed on AKM Care."
          robots="noindex, follow"
          omitCanonical
        />
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
      </>
    );
  }

  const price = getEffectivePrice(product);
  const savings = Math.max(0, product.mrp - price);
  const availableQty = getAvailableQuantity(product);
  const inStock = isProductInStock(product);
  const stock = getStockLabel(product);
  const discountOff = displayDiscountPercent(product.discountPercent);
  const maxQty = Math.max(1, availableQty);
  const seo = productSeo(product);
  const crumbs = shopBreadcrumbs([
    { name: product.categoryLabel, url: `/shop?category=${encodeURIComponent(product.category)}` },
    { name: product.name, url: seo.canonical },
  ]);
  const wishlisted = isWishlisted(product.id);
  const compared = isCompared(product.id);
  const hasRealReviews = (product.reviewCount ?? 0) > 0 && product.rating != null;
  const warrantyLabel = displayWarranty(product.warranty);
  const returnLabel = isMeaningful(product.returnPolicy) ? product.returnPolicy!.trim() : null;
  const shippingLabel = isMeaningful(product.shippingTime)
    ? formatProductShippingCopy(product.shippingTime)
    : formatProductShippingCopy(null);

  const selection = {
    product,
    quantity: qty,
    colorId: selectedColor?.id,
    colorName: selectedColor?.name,
    variantId: selectedVariant?.id,
    variantName: selectedVariant?.name,
  };

  const handleAdd = () => {
    if (!inStock || addLockRef.current) return;
    addLockRef.current = true;
    setAdding(true);
    addToCart(selection);
    setJustAdded(true);
    window.setTimeout(() => {
      setAdding(false);
      addLockRef.current = false;
    }, 600);
    window.setTimeout(() => setJustAdded(false), 4000);
  };

  const handleBuy = () => {
    if (!inStock || adding) return;
    buyNowLine(selection);
    navigate("/checkout");
  };

  const checkPincode = () => {
    const p = pinInput.trim();
    if (!isValidIndianPincode(p)) {
      setPinStatus("invalid");
      return;
    }
    setPinStatus(mockDeliveryAvailable(p) ? "ok" : "no");
  };

  const specs: Array<[string, string]> = [
    ["Brand", product.brand || "AKM Care"],
    ["Category", product.categoryLabel],
    isMeaningful(product.productCode) ? ["Product Code", product.productCode] : null,
    isMeaningful(product.sku) ? ["SKU", product.sku] : null,
    selectedVariant?.name && isMeaningful(selectedVariant.name)
      ? ["Variant", selectedVariant.name]
      : null,
    selectedColor?.name && isMeaningful(selectedColor.name) ? ["Colour", selectedColor.name] : null,
    isMeaningful(product.dimensions) ? ["Dimensions / Length", product.dimensions] : null,
    isMeaningful(product.weight) ? ["Weight", String(product.weight)] : null,
    isMeaningful(product.packingType) ? ["Packaging", String(product.packingType)] : null,
    product.gstPercent > 0 ? ["GST", `${product.gstPercent}% (included in price where applicable)`] : null,
    isMeaningful(product.hsn) ? ["HSN", product.hsn] : null,
    warrantyLabel ? ["Warranty", warrantyLabel] : null,
    shippingLabel ? ["Shipping duration", shippingLabel] : null,
  ].filter(Boolean) as Array<[string, string]>;

  if (product.specifications) {
    const seen = new Set(specs.map(([key]) => key.toLowerCase()));
    for (const [key, value] of Object.entries(product.specifications)) {
      const name = key.trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      specs.push([name, value]);
    }
  }

  return (
    <>
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={seo.canonical}
        exactTitle={seo.exactTitle}
        ogImage={seo.ogImage}
        ogImageAlt={seo.ogImageAlt}
        ogType={seo.ogType}
        schema={[seo.schema, breadcrumbSchema(crumbs), faqSchema(seo.faqs)].filter(Boolean)}
      />

      <section className="section-padding bg-white pt-4 sm:pt-6 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-16">
        <div className="container-premium">
          <ShopBreadcrumbs items={crumbs} className="mb-4 sm:mb-6" />

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            <div className="lg:sticky lg:top-[calc(var(--nav-height,4.5rem)+1rem)]">
              <ProductGallery
                images={galleryImages.length ? galleryImages : product.images}
                productName={product.name}
              />
            </div>

            <div className="space-y-5 min-w-0">
              <div>
                <p className="type-meta text-[#E8621A]">
                  {product.brand || "AKM Care"} · {product.categoryLabel}
                </p>
                <h1 className="type-product text-2xl sm:text-3xl lg:text-[2rem] text-[#1A1A1A] mt-1.5 leading-snug">
                  {product.name}
                </h1>
                {isMeaningful(product.productCode) && (
                  <p className="type-meta text-[#6B6B6B] mt-2">
                    Product Code: <span className="text-[#1A1A1A]">{product.productCode}</span>
                  </p>
                )}
                {isMeaningful(product.shortDescription) && (
                  <p className="text-sm text-[#6B6B6B] mt-2 leading-relaxed">{product.shortDescription}</p>
                )}
              </div>

              {hasRealReviews && (
                <div className="flex items-center gap-2 text-sm">
                  <Star size={14} className="text-amber-500 fill-amber-500" aria-hidden />
                  <span className="font-medium">{Number(product.rating).toFixed(1)}</span>
                  <span className="text-[#6B6B6B]">({product.reviewCount} reviews)</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="type-price text-3xl sm:text-4xl text-[#E8621A]">{formatINR(price)}</span>
                  {product.mrp > price && (
                    <span className="text-base sm:text-lg text-[#6B6B6B] line-through">
                      MRP {formatINR(product.mrp)}
                    </span>
                  )}
                  {discountOff > 0 && (
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-[#E8621A]/10 text-[#E8621A]">
                      {discountOff}% OFF
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-sm text-emerald-700 font-medium">You Save {formatINR(savings)}</p>
                )}
                {product.gstPercent > 0 && (
                  <p className="text-xs text-[#6B6B6B]">Inclusive of taxes where applicable</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full",
                    inStock ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {inStock ? "In Stock" : "Out of Stock"}
                </span>
                {stock?.tone === "low" && (
                  <span className="text-xs font-medium text-amber-700">{stock.text}</span>
                )}
              </div>

              {product.colors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Colour:{" "}
                    <span className="font-normal text-[#6B6B6B]">{selectedColor?.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-2" role="listbox" aria-label="Colour">
                    {product.colors.map((c) => {
                      const selected = (colorId ?? product.colors[0]?.id) === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          aria-label={c.name}
                          title={c.name}
                          onClick={() => setColorId(c.id)}
                          className={cn(
                            "h-10 w-10 rounded-full border-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
                            selected ? "border-[#E8621A] ring-2 ring-[#E8621A]/25" : "border-black/10",
                          )}
                          style={{ backgroundColor: c.hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {product.variants.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Variant
                    {selectedVariant?.name ? (
                      <span className="font-normal text-[#6B6B6B]">: {selectedVariant.name}</span>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap gap-2" role="listbox" aria-label="Variant">
                    {product.variants.map((v) => {
                      const selected = (variantId ?? product.variants[0]?.id) === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => setVariantId(v.id)}
                          className={cn(
                            "min-h-10 px-3.5 py-2 rounded-full text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
                            selected
                              ? "border-[#E8621A] bg-[#E8621A]/10 text-[#E8621A]"
                              : "border-black/10 text-[#6B6B6B] hover:border-black/20",
                          )}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">Quantity</p>
                <div className="inline-flex items-center gap-1 rounded-full border border-black/10 p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={!inStock || qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-black/[0.04] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
                  >
                    <Minus size={16} aria-hidden />
                  </button>
                  <span className="w-10 text-center font-semibold tabular-nums" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={!inStock || qty >= maxQty}
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-black/[0.04] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
                  >
                    <Plus size={16} aria-hidden />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-black/[0.06] bg-[#FAF8F5] p-3.5 space-y-2">
                <p className="text-sm font-semibold">Deliver to</p>
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor="pdp-pincode">
                    Pincode
                  </label>
                  <input
                    id="pdp-pincode"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter pincode"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setPinStatus("idle");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") checkPincode();
                    }}
                    className="flex-1 min-w-0 h-11 rounded-full border border-black/10 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
                  />
                  <button type="button" onClick={checkPincode} className="btn-secondary h-11 px-4 shrink-0">
                    Check
                  </button>
                </div>
                {pinStatus === "invalid" && (
                  <p className="text-xs text-destructive">Enter a valid 6-digit Indian pincode.</p>
                )}
                {pinStatus === "ok" && (
                  <p className="text-xs text-emerald-700">
                    We deliver to this pincode. Exact delivery date is confirmed at checkout.
                  </p>
                )}
                {pinStatus === "no" && (
                  <p className="text-xs text-amber-800">
                    This pincode may not be serviceable yet. Try another pincode or contact support.
                  </p>
                )}
                {shippingLabel && (
                  <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5 pt-0.5">
                    <Truck size={14} className="text-[#E8621A]" aria-hidden />
                    Shipping: {shippingLabel}
                  </p>
                )}
              </div>

              <div ref={actionsRef} className="space-y-3">
                {inStock ? (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      disabled={adding}
                      onClick={handleAdd}
                      className="btn-primary flex-1 h-12 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {justAdded && !adding ? (
                        <>
                          <Check size={18} aria-hidden /> Added to cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} aria-hidden />
                          {adding ? "Adding…" : "Add to Cart"}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={adding}
                      onClick={handleBuy}
                      className="btn-secondary flex-1 h-12 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Zap size={18} aria-hidden /> Buy Now
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/shop?interest=${encodeURIComponent(product.name)}`)
                    }
                    className="btn-primary w-full h-12 inline-flex items-center justify-center gap-2"
                  >
                    <Bell size={18} aria-hidden /> Notify Me
                  </button>
                )}

                {justAdded && (
                  <p className="text-sm text-emerald-700">
                    Added to cart.{" "}
                    <Link to="/cart" className="font-semibold underline underline-offset-2">
                      View Cart
                    </Link>
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={wishlisted}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    onClick={() => toggleWishlist(product.id, product.name)}
                    className={cn(
                      "btn-tertiary h-11 px-4 inline-flex items-center gap-2",
                      wishlisted && "border-[#E8621A]/40 text-[#E8621A] bg-[#E8621A]/5",
                    )}
                  >
                    <Heart size={16} fill={wishlisted ? "currentColor" : "none"} aria-hidden />
                    {wishlisted ? "Wishlisted" : "Wishlist"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={compared}
                    aria-label={compared ? "Remove from compare" : "Add to compare"}
                    onClick={() => toggleCompare(product)}
                    className={cn(
                      "btn-tertiary h-11 px-4 inline-flex items-center gap-2",
                      compared && "border-[#E8621A]/40 text-[#E8621A] bg-[#E8621A]/5",
                    )}
                  >
                    <GitCompare size={16} aria-hidden />
                    {compared ? "Comparing" : "Compare"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareProduct({ name: product.name, slug: product.slug })}
                    className="btn-tertiary h-11 px-4 inline-flex items-center gap-2"
                  >
                    <Share2 size={16} aria-hidden /> Share
                  </button>
                </div>
              </div>

              <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] sm:text-xs text-[#6B6B6B]">
                {[
                  shippingLabel ? "Fast shipping" : null,
                  returnLabel ? "Easy returns" : null,
                  "Secure payment",
                  "Genuine products",
                ]
                  .filter(Boolean)
                  .map((label) => (
                    <li
                      key={label as string}
                      className="rounded-lg border border-black/[0.06] px-2.5 py-2 text-center font-medium"
                    >
                      {label}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 sm:mt-14 grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <h2 className="type-section">About this product</h2>
              {isMeaningful(product.detailedDescription) ? (
                <p className="text-[#6B6B6B] leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {product.detailedDescription}
                </p>
              ) : isMeaningful(product.shortDescription) ? (
                <p className="text-[#6B6B6B] leading-relaxed text-sm sm:text-base">
                  {product.shortDescription}
                </p>
              ) : (
                <p className="text-[#6B6B6B] text-sm">
                  Explore authentic {product.categoryLabel.toLowerCase()} from AKM Care.
                </p>
              )}

              <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.06] overflow-hidden">
                {(
                  [
                    ["shipping", "Shipping", shippingLabel, Truck],
                    ["returns", "Returns", returnLabel, RotateCcw],
                    ["warranty", "Warranty", warrantyLabel, ShieldCheck],
                  ] as const
                )
                  .filter(([, , value]) => Boolean(value))
                  .map(([key, title, value, Icon]) => {
                    const open = openSection === key;
                    return (
                      <div key={key}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenSection(open ? null : key)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8621A]/30"
                        >
                          <Icon size={18} className="text-[#E8621A] shrink-0" aria-hidden />
                          <span className="font-semibold text-sm flex-1">{title}</span>
                          <span className="text-xs text-[#6B6B6B]">{open ? "Hide" : "Show"}</span>
                        </button>
                        <div
                          className={cn(
                            "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
                            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                          )}
                        >
                          <div className="overflow-hidden">
                            <p className="px-4 pb-3.5 pl-[2.75rem] text-sm text-[#6B6B6B] leading-relaxed">
                              {value}
                              {key === "returns" || key === "shipping" ? (
                                <>
                                  {" "}
                                  Full policy:{" "}
                                  <Link to="/shipping-returns" className="text-[#E8621A] font-semibold hover:underline">
                                    shipping and returns
                                  </Link>
                                  .
                                </>
                              ) : null}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div>
              <h2 className="type-section mb-4">Specifications</h2>
              {specs.length > 0 ? (
                <dl className="rounded-2xl border border-black/[0.06] divide-y divide-black/[0.06] text-sm">
                  {specs.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-[#6B6B6B] shrink-0">{k}</dt>
                      <dd className="font-medium text-[#1A1A1A] text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-[#6B6B6B]">Specifications will appear as product data is updated.</p>
              )}
            </div>
          </div>

          {seo.faqs.length > 0 && (
            <section className="mt-10 sm:mt-12" aria-labelledby="product-facts-heading">
              <h2 id="product-facts-heading" className="type-section mb-4">
                Product questions
              </h2>
              <div className="space-y-3">
                {seo.faqs.map((item) => (
                  <details
                    key={item.question}
                    className="rounded-2xl border border-black/[0.06] bg-[#FAF8F5] px-4 py-3"
                  >
                    <summary className="cursor-pointer font-semibold text-sm text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/30 rounded-sm">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed">{item.answer}</p>
                  </details>
                ))}
              </div>
              <p className="text-sm text-[#6B6B6B] mt-4">
                Need delivery timelines or the unused-product return window? See{" "}
                <Link to="/shipping-returns" className="text-[#E8621A] font-semibold hover:underline">
                  shipping and returns
                </Link>
                .
              </p>
            </section>
          )}

          <RelatedProducts
            products={related}
            currentId={product.id}
            category={product.category}
            limit={8}
          />
          <RecentlyViewedStrip excludeId={product.id} className="mt-10" />

          <p className="text-center text-sm text-[#6B6B6B] mt-8">
            <Link
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              className="text-[#E8621A] font-semibold hover:underline"
            >
              Browse {product.categoryLabel}
            </Link>
            <span className="mx-2 text-[#C4C4C4]" aria-hidden>
              ·
            </span>
            <Link to="/shop" className="text-[#E8621A] font-semibold hover:underline">
              All products
            </Link>
          </p>
        </div>
      </section>

      <StickyBuyBar
        visible={showSticky}
        price={price}
        inStock={inStock}
        productName={product.name}
        adding={adding}
        onAdd={handleAdd}
        onBuy={handleBuy}
      />
    </>
  );
}
