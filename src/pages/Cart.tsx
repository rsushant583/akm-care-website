import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, Bookmark } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { EmptyState, ShopBreadcrumbs } from "@/components/shop";
import { shopBreadcrumbs } from "@/lib/ecommerce/seo";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    savedForLater,
    totals,
    couponCode,
    setCouponCode,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCart,
    removeSaved,
  } = useCart();

  const crumbs = shopBreadcrumbs([{ name: "Cart", url: "/cart" }]);

  return (
    <>
      <SEO
        title="Shopping Cart"
        description="Review your AKM Care cart, update quantities, save for later, and proceed to checkout."
        canonical="/cart"
        robots="noindex, follow"
      />

      <section className="section-padding bg-white pt-6">
        <div className="container-premium">
          <ShopBreadcrumbs items={crumbs} className="mb-6" />
          <h1 className="font-heading text-3xl sm:text-4xl mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Browse the shop and add sarees, textiles, or village products to get started."
            />
          ) : (
            <div className="grid lg:grid-cols-[1fr_340px] gap-8">
              <div className="space-y-4">
                {items.map((line) => (
                  <div
                    key={`${line.productId}-${line.colorId}-${line.variantId}`}
                    className="flex gap-4 p-4 rounded-2xl border border-black/[0.06] bg-[#FAF8F5]"
                  >
                    <Link to={productPath(line.slug)} className="shrink-0 h-24 w-20 rounded-xl overflow-hidden bg-white border border-black/[0.06]">
                      <img src={line.image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={productPath(line.slug)} className="font-heading text-base hover:text-[#E8621A] line-clamp-2">
                        {line.name}
                      </Link>
                      <p className="text-xs text-[#6B6B6B] mt-1">
                        SKU: {line.sku}
                        {line.colorName ? ` · ${line.colorName}` : ""}
                        {line.variantName ? ` · ${line.variantName}` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-1.5 py-0.5">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => updateQuantity(line.productId, line.quantity - 1, line.colorId, line.variantId)}
                            className="h-7 w-7 rounded-full flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-semibold w-5 text-center">{line.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => updateQuantity(line.productId, line.quantity + 1, line.colorId, line.variantId)}
                            className="h-7 w-7 rounded-full flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveForLater(line.productId, line.colorId, line.variantId)}
                          className="text-xs font-semibold text-[#6B6B6B] inline-flex items-center gap-1 hover:text-[#E8621A]"
                        >
                          <Bookmark size={12} /> Save for later
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(line.productId, line.colorId, line.variantId)}
                          className="text-xs font-semibold text-destructive inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-[#E8621A]">{formatINR(line.unitPrice * line.quantity)}</p>
                      {line.mrp > line.unitPrice && (
                        <p className="text-xs text-[#6B6B6B] line-through">{formatINR(line.mrp * line.quantity)}</p>
                      )}
                    </div>
                  </div>
                ))}

                {savedForLater.length > 0 && (
                  <div className="pt-6">
                    <h2 className="font-heading text-xl mb-3">Saved for later</h2>
                    <div className="space-y-3">
                      {savedForLater.map((line) => (
                        <div
                          key={`saved-${line.productId}-${line.colorId}`}
                          className="flex gap-4 p-4 rounded-2xl border border-dashed border-black/10"
                        >
                          <img src={line.image || "/placeholder.svg"} alt="" className="h-16 w-14 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-heading text-sm line-clamp-1">{line.name}</p>
                            <p className="text-xs text-[#6B6B6B]">{formatINR(line.unitPrice)}</p>
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
                )}
              </div>

              <aside className="rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-5 h-fit sticky top-24 space-y-4">
                <h2 className="font-heading text-xl">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Subtotal ({totals.itemCount} items)</span>
                    <span className="font-medium">{formatINR(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">MRP Total</span>
                    <span className="line-through text-[#6B6B6B]">{formatINR(totals.mrpTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Savings</span>
                    <span className="font-medium">−{formatINR(totals.savings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">GST (included / summary)</span>
                    <span className="font-medium">{formatINR(totals.gstTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Shipping</span>
                    <span className="text-xs font-medium text-[#6B6B6B]">Calculated at checkout</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.06]">
                  <label className="text-xs font-semibold text-[#6B6B6B]">Coupon (coming soon)</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter code"
                      disabled
                      className="flex-1 px-3 py-2 rounded-xl border border-black/10 text-sm bg-white disabled:opacity-60"
                    />
                    <button type="button" disabled className="px-3 py-2 rounded-xl bg-muted text-sm font-semibold opacity-60">
                      Apply
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-black/[0.06]">
                  <span className="font-heading text-lg">Order Total</span>
                  <span className="font-semibold text-2xl text-[#E8621A]">{formatINR(totals.orderTotal)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/checkout")}
                  className="w-full py-3 rounded-full bg-[#E8621A] text-white font-semibold hover:brightness-105"
                >
                  Proceed to Checkout
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
