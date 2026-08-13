import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Minus, Plus, Trash2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { EmptyState, ShopBreadcrumbs } from "@/components/shop";
import { shopBreadcrumbs } from "@/lib/ecommerce/seo";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

function SavedSection() {
  const { savedForLater, moveToCart, removeSaved } = useCart();
  if (savedForLater.length === 0) return null;

  return (
    <div className="pt-8">
      <h2 className="type-section mb-3">Saved for later</h2>
      <div className="space-y-3">
        {savedForLater.map((line) => (
          <div
            key={`saved-${line.productId}-${line.colorId}-${line.variantId}`}
            className="flex gap-4 p-4 rounded-2xl border border-dashed border-black/10 bg-white"
          >
            <img
              src={line.image || "/placeholder.svg"}
              alt=""
              className="h-16 w-14 rounded-lg object-cover bg-[#F5F0EB]"
            />
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm line-clamp-1">{line.name}</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {[line.colorName, line.variantName].filter(Boolean).join(" · ") || line.sku}
              </p>
              <p className="text-sm font-semibold text-[#E8621A] mt-1">{formatINR(line.unitPrice)}</p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  className="text-xs font-semibold text-[#E8621A]"
                  onClick={() => moveToCart(line.productId, line.colorId, line.variantId)}
                >
                  Move to cart
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-destructive"
                  onClick={() => removeSaved(line.productId, line.colorId, line.variantId)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    totals,
    couponCode,
    setCouponCode,
    updateQuantity,
    removeFromCart,
    saveForLater,
    refreshCartFromCatalog,
    refreshing,
    shippingConfig,
  } = useCart();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [qtyBusyKey, setQtyBusyKey] = useState<string | null>(null);

  const crumbs = shopBreadcrumbs([{ name: "Cart", url: "/cart" }]);

  useEffect(() => {
    if (items.length === 0) return;
    void refreshCartFromCatalog().then((result) => {
      if (result.unavailableNames.length) {
        toast.error(
          result.unavailableNames.length === 1
            ? `${result.unavailableNames[0]} is no longer available.`
            : "Some items are no longer available and were removed.",
        );
      } else if (result.priceChanged) {
        toast.message("Cart prices were updated to the latest catalog prices.");
      } else if (result.stockChanged) {
        toast.message("Quantities were adjusted to match available stock.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeQty = (line: (typeof items)[number], next: number) => {
    const key = `${line.productId}-${line.colorId}-${line.variantId}`;
    if (qtyBusyKey === key) return;
    setQtyBusyKey(key);
    updateQuantity(line.productId, next, line.colorId, line.variantId);
    window.setTimeout(() => setQtyBusyKey(null), 180);
  };

  const goCheckout = async () => {
    if (checkoutBusy || items.length === 0) return;
    setCheckoutBusy(true);
    try {
      const result = await refreshCartFromCatalog();
      if (result.unavailableNames.length) {
        toast.error("Your cart has changed. Please review it before continuing.");
        return;
      }
      if (result.priceChanged || result.stockChanged) {
        toast.message("Please review updated prices or stock before checkout.");
        return;
      }
      navigate("/checkout");
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <>
      <SEO
        title="Shopping Cart"
        description="Review your AKM Care cart, update quantities, save for later, and proceed to checkout."
        canonical="/cart"
        robots="noindex, follow"
      />

      <section className="section-padding bg-white pt-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-16">
        <div className="container-premium">
          <ShopBreadcrumbs items={crumbs} className="mb-6" />
          <div className="flex items-end justify-between gap-3 mb-8">
            <h1 className="type-display text-3xl sm:text-4xl">Shopping Cart</h1>
            {refreshing && <p className="text-xs text-[#6B6B6B]">Updating…</p>}
          </div>

          {items.length === 0 ? (
            <div>
              <EmptyState
                title="Your cart is empty"
                description="Browse the shop and add sarees, textiles, or village products to get started."
                actionLabel="Continue Shopping"
                actionHref="/shop"
              />
              <SavedSection />
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
              <div className="space-y-4 min-w-0">
                {items.map((line) => {
                  const key = `${line.productId}-${line.colorId}-${line.variantId}`;
                  const unavailable = line.maxQuantity <= 0;
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex gap-4 p-4 rounded-2xl border border-black/[0.06] bg-[#FAF8F5]",
                        unavailable && "opacity-80",
                      )}
                    >
                      <Link
                        to={productPath(line.slug)}
                        className="shrink-0 h-24 w-20 overflow-hidden bg-white ring-1 ring-black/[0.06]"
                      >
                        <img
                          src={line.image || "/placeholder.svg"}
                          alt=""
                          className="h-full w-full object-contain object-center"
                          loading="lazy"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={productPath(line.slug)}
                          className="font-heading text-base hover:text-[#E8621A] line-clamp-2"
                        >
                          {line.name}
                        </Link>
                        <p className="type-meta text-[#6B6B6B] mt-1">
                          {[line.colorName, line.variantName].filter(Boolean).join(" · ") || `SKU: ${line.sku}`}
                        </p>
                        {unavailable ? (
                          <p className="text-xs font-semibold text-destructive mt-2">
                            This product is no longer available.
                          </p>
                        ) : (
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-0.5">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={line.quantity <= 1 || qtyBusyKey === key}
                                onClick={() => changeQty(line, line.quantity - 1)}
                                className="h-9 w-9 rounded-full flex items-center justify-center disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
                              >
                                <Minus size={14} aria-hidden />
                              </button>
                              <span className="text-sm font-semibold w-7 text-center tabular-nums" aria-live="polite">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={line.quantity >= line.maxQuantity || qtyBusyKey === key}
                                onClick={() => changeQty(line, line.quantity + 1)}
                                className="h-9 w-9 rounded-full flex items-center justify-center disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
                              >
                                <Plus size={14} aria-hidden />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => saveForLater(line.productId, line.colorId, line.variantId)}
                              className="text-xs font-semibold text-[#6B6B6B] inline-flex items-center gap-1 hover:text-[#E8621A]"
                            >
                              <Bookmark size={12} aria-hidden /> Save for later
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(line.productId, line.colorId, line.variantId)}
                              className="text-xs font-semibold text-destructive inline-flex items-center gap-1"
                            >
                              <Trash2 size={12} aria-hidden /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="type-price text-base">{formatINR(line.unitPrice * line.quantity)}</p>
                        {line.mrp > line.unitPrice && (
                          <p className="text-xs text-[#6B6B6B] line-through">
                            {formatINR(line.mrp * line.quantity)}
                          </p>
                        )}
                        <p className="text-[11px] text-[#6B6B6B] mt-1">{formatINR(line.unitPrice)} each</p>
                      </div>
                    </div>
                  );
                })}
                <SavedSection />
              </div>

              <aside className="rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-5 h-fit lg:sticky lg:top-24 space-y-4">
                <h2 className="font-heading text-xl">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6B6B6B]">Subtotal ({totals.itemCount} items)</span>
                    <span className="font-medium">{formatINR(totals.subtotal)}</span>
                  </div>
                  {totals.savings > 0 && (
                    <div className="flex justify-between gap-3 text-emerald-700">
                      <span>Product savings</span>
                      <span className="font-medium">−{formatINR(totals.savings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6B6B6B]">GST</span>
                    <span className="text-xs font-medium text-[#6B6B6B]">Included where applicable</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#6B6B6B]">Shipping</span>
                    <span className="text-xs font-medium text-[#6B6B6B] text-right">
                      Calculated at checkout
                      {shippingConfig.freeAbove > 0 ? (
                        <>
                          <br />
                          Free above {formatINR(shippingConfig.freeAbove)}
                        </>
                      ) : null}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.06]">
                  <label htmlFor="cart-coupon" className="text-xs font-semibold text-[#6B6B6B]">
                    Coupon code
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="cart-coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
                    />
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-1.5">
                    Coupons are validated securely at payment. Final discount may differ from estimates.
                  </p>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-black/[0.06]">
                  <span className="font-heading text-lg">Order Total</span>
                  <span className="type-price text-2xl text-[#E8621A]">{formatINR(totals.orderTotal)}</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B] -mt-2">Before shipping & verified discounts</p>

                <button
                  type="button"
                  disabled={checkoutBusy || items.some((l) => l.maxQuantity <= 0)}
                  onClick={() => void goCheckout()}
                  className="btn-primary w-full h-12 disabled:opacity-50"
                >
                  {checkoutBusy ? "Checking…" : "Proceed to Checkout"}
                </button>
                <Link to="/shop" className="block text-center text-sm font-semibold text-[#E8621A] hover:underline">
                  Continue shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
