import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/ecommerce/pricing";
import type { CheckoutDraft, PaymentMethodId } from "@/lib/ecommerce/types";
import { EmptyState, ShopBreadcrumbs } from "@/components/shop";
import { shopBreadcrumbs } from "@/lib/ecommerce/seo";
import { isValidIndianPincode } from "@/lib/pincodeDelivery";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { listAddresses, type Address } from "@/services/addressService";
import { attachPayment, createPendingOrder, markOrderFailed } from "@/services/orderService";
import { createRazorpayOrder, loadRazorpayScript, verifyRazorpayPayment } from "@/lib/paymentService";
import { sendOrderEmail } from "@/lib/emailService";

const STEPS = ["Cart", "Address", "Shipping", "Payment", "Review", "Order"] as const;

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Maharashtra",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
  "Other",
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();
  const {
    items,
    totals,
    checkoutTotals,
    clearCart,
    couponCode,
    setCouponCode,
    shippingMethod,
    setShippingMethod,
    shippingTotal,
  } = useCart();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [draft, setDraft] = useState<CheckoutDraft>({
    customer: {
      name: profile?.full_name || "",
      email: user?.email || "",
      phone: profile?.phone || "",
    },
    address: { line1: "", line2: "", city: "", state: "Gujarat", pincode: "", country: "India" },
    shippingMethod: "standard",
    paymentMethod: "razorpay",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    void listAddresses(user.id)
      .then((rows) => {
        setSavedAddresses(rows);
        const def = rows.find((a) => a.is_default) || rows[0];
        if (def) applyAddress(def);
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    setDraft((d) => ({
      ...d,
      customer: {
        name: d.customer.name || profile?.full_name || "",
        email: d.customer.email || user?.email || "",
        phone: d.customer.phone || profile?.phone || "",
      },
      shippingMethod,
    }));
  }, [profile, user, shippingMethod]);

  const crumbs = shopBreadcrumbs([
    { name: "Cart", url: "/cart" },
    { name: "Checkout", url: "/checkout" },
  ]);

  const applyAddress = (a: Address) => {
    setDraft((d) => ({
      ...d,
      customer: {
        name: a.full_name || d.customer.name,
        email: d.customer.email,
        phone: a.phone || d.customer.phone,
      },
      address: {
        line1: a.area,
        line2: a.landmark || "",
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        country: "India",
      },
    }));
  };

  const addressPayload = useMemo(
    () => ({
      fullName: draft.customer.name,
      phone: draft.customer.phone,
      area: draft.address.line1,
      landmark: draft.address.line2,
      city: draft.address.city,
      state: draft.address.state,
      pincode: draft.address.pincode,
      country: draft.address.country,
    }),
    [draft],
  );

  const validateThrough = (target: number) => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return false;
    }
    if (target >= 2) {
      if (!draft.customer.name.trim() || !draft.customer.email.trim() || !draft.customer.phone.trim()) {
        toast.error("Please fill customer name, email, and phone.");
        return false;
      }
      if (!draft.address.line1.trim() || !draft.address.city.trim() || !draft.address.state.trim()) {
        toast.error("Please complete your delivery address.");
        return false;
      }
      if (!isValidIndianPincode(draft.address.pincode)) {
        toast.error("Please enter a valid 6-digit pincode.");
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    const next = Math.min(5, step + 1);
    if (!validateThrough(next)) return;
    setStep(next);
  };

  const placeOrder = async () => {
    if (!validateThrough(5)) return;
    setSubmitting(true);
    let orderId: string | null = null;
    try {
      const order = await createPendingOrder({
        userId: user?.id,
        customer: draft.customer,
        address: addressPayload,
        items,
        shippingMethod,
        shippingTotal,
        couponCode: couponCode || undefined,
        couponDiscount: checkoutTotals.couponDiscount,
        notes: draft.notes,
      });
      orderId = order.id;

      await sendOrderEmail("order_confirmation", {
        orderNumber: order.order_number,
        customer: draft.customer,
        totals: checkoutTotals,
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
      });

      if (draft.paymentMethod !== "razorpay") {
        toast.error("Only Razorpay is enabled currently.");
        await markOrderFailed(order.id, "Unsupported payment method");
        return;
      }

      const ready = await loadRazorpayScript();
      if (!ready) {
        toast.error("Could not load Razorpay. Check your connection.");
        await markOrderFailed(order.id, "Razorpay script failed");
        return;
      }

      const created = await createRazorpayOrder(
        items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        draft.customer,
        {
          shippingTotal,
          discountTotal: checkoutTotals.couponDiscount,
        },
      );

      if (!created?.success || !created.order) {
        toast.error(created?.error || "Could not create payment order.");
        await markOrderFailed(order.id, created?.error || "create order failed");
        return;
      }

      const rzp = new window.Razorpay({
        key: created.keyId,
        amount: created.order.amount,
        currency: created.order.currency || "INR",
        name: "AKM Care",
        description: `Order ${order.order_number}`,
        order_id: created.order.id,
        prefill: {
          name: draft.customer.name,
          email: draft.customer.email,
          contact: draft.customer.phone,
        },
        theme: { color: "#E8621A" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verified = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderPayload: {
                items: created.items || items.map((i) => ({
                  productId: i.productId,
                  productName: i.name,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                })),
                totalAmount: created.amount ?? checkoutTotals.orderTotal,
                customer: draft.customer,
              },
            });

            if (!verified?.success) {
              toast.error(verified?.error || "Payment verification failed.");
              await markOrderFailed(order.id, verified?.error || "verify failed");
              return;
            }

            await attachPayment({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amount: Number(created.amount ?? checkoutTotals.orderTotal),
              method: "razorpay",
              status: "captured",
            });

            await sendOrderEmail("payment_success", {
              orderNumber: order.order_number,
              customer: draft.customer,
              paymentId: response.razorpay_payment_id,
              amount: created.amount ?? checkoutTotals.orderTotal,
            });

            clearCart();
            setStep(6);
            toast.success("Payment successful");
            navigate(`/order-success?order=${order.order_number}`, { replace: true });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Payment callback failed");
            await markOrderFailed(order.id, "callback error");
          }
        },
      });

      rzp.on("payment.failed", async (resp: { error?: { description?: string } }) => {
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
        if (orderId) await markOrderFailed(orderId, resp?.error?.description || "payment.failed");
      });

      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
      if (orderId) await markOrderFailed(orderId, "checkout exception");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step < 6) {
    return (
      <>
        <SEO title="Checkout" canonical="/checkout" robots="noindex, follow" />
        <section className="section-padding bg-white">
          <div className="container-premium">
            <EmptyState title="Nothing to checkout" description="Add products to your cart first." />
            <div className="mt-6">
              <Link to="/shop" className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-3 inline-flex">
                Browse shop
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO title="Checkout" description="Secure AKM Care checkout with Razorpay." canonical="/checkout" robots="noindex, follow" />
      <section className="section-padding bg-white pt-6">
        <div className="container-premium">
          <ShopBreadcrumbs items={crumbs} className="mb-6" />
          <h1 className="font-heading text-3xl sm:text-4xl mb-6">Checkout</h1>

          <ol className="flex flex-wrap gap-2 mb-8">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold border",
                  step === i + 1 ? "bg-[#E8621A] text-white border-[#E8621A]" : step > i + 1 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-black/10 text-[#6B6B6B]",
                )}
              >
                {i + 1}. {label}
              </li>
            ))}
          </ol>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-6">
              {step === 1 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 bg-[#FAF8F5] space-y-3">
                  <h2 className="font-heading text-xl">Cart review</h2>
                  {items.map((line) => (
                    <div key={`${line.productId}-${line.colorId}-${line.variantId}`} className="flex justify-between text-sm gap-3">
                      <span>
                        {line.name} × {line.quantity}
                      </span>
                      <span className="font-semibold">{formatINR(line.unitPrice * line.quantity)}</span>
                    </div>
                  ))}
                  <button type="button" onClick={goNext} className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5">
                    Continue to address
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-heading text-xl">Delivery address</h2>
                    {!isAuthenticated && (
                      <Link to="/auth" state={{ from: "/checkout" }} className="text-xs font-semibold text-[#E8621A]">
                        Sign in to use saved addresses
                      </Link>
                    )}
                  </div>

                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      {savedAddresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => applyAddress(a)}
                          className="w-full text-left rounded-xl border border-black/10 p-3 text-sm hover:border-[#E8621A]/50"
                        >
                          <span className="uppercase text-[10px] font-bold text-[#E8621A]">{a.label}</span>
                          <p className="font-semibold">{a.full_name}</p>
                          <p className="text-[#6B6B6B]">
                            {a.area}, {a.city}, {a.state} — {a.pincode}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <input className="rounded-xl border border-black/10 px-3 py-2.5" placeholder="Full name" value={draft.customer.name} onChange={(e) => setDraft((d) => ({ ...d, customer: { ...d.customer, name: e.target.value } }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2.5" placeholder="Phone" value={draft.customer.phone} onChange={(e) => setDraft((d) => ({ ...d, customer: { ...d.customer, phone: e.target.value } }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2.5 sm:col-span-2" placeholder="Email" type="email" value={draft.customer.email} onChange={(e) => setDraft((d) => ({ ...d, customer: { ...d.customer, email: e.target.value } }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2.5 sm:col-span-2" placeholder="Area / street" value={draft.address.line1} onChange={(e) => setDraft((d) => ({ ...d, address: { ...d.address, line1: e.target.value } }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2.5 sm:col-span-2" placeholder="Landmark (optional)" value={draft.address.line2} onChange={(e) => setDraft((d) => ({ ...d, address: { ...d.address, line2: e.target.value } }))} />
                    <input className="rounded-xl border border-black/10 px-3 py-2.5" placeholder="City" value={draft.address.city} onChange={(e) => setDraft((d) => ({ ...d, address: { ...d.address, city: e.target.value } }))} />
                    <select className="rounded-xl border border-black/10 px-3 py-2.5" value={draft.address.state} onChange={(e) => setDraft((d) => ({ ...d, address: { ...d.address, state: e.target.value } }))}>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input className="rounded-xl border border-black/10 px-3 py-2.5" placeholder="Pincode" value={draft.address.pincode} onChange={(e) => setDraft((d) => ({ ...d, address: { ...d.address, pincode: e.target.value } }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(1)} className="rounded-full border border-black/10 px-5 py-2.5 font-semibold">
                      Back
                    </button>
                    <button type="button" onClick={goNext} className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5">
                      Continue to shipping
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
                  <h2 className="font-heading text-xl">Shipping</h2>
                  {(
                    [
                      { id: "standard", label: "Standard (3–5 days)", price: 49 },
                      { id: "express", label: "Express (1–2 days)", price: 99 },
                    ] as const
                  ).map((opt) => (
                    <label key={opt.id} className={cn("flex items-center justify-between rounded-xl border p-4 cursor-pointer", shippingMethod === opt.id ? "border-[#E8621A] bg-[#FFF7F2]" : "border-black/10")}>
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ship"
                          checked={shippingMethod === opt.id}
                          onChange={() => {
                            setShippingMethod(opt.id);
                            setDraft((d) => ({ ...d, shippingMethod: opt.id }));
                          }}
                        />
                        {opt.label}
                      </span>
                      <span className="font-semibold">{formatINR(opt.price)}</span>
                    </label>
                  ))}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(2)} className="rounded-full border border-black/10 px-5 py-2.5 font-semibold">
                      Back
                    </button>
                    <button type="button" onClick={goNext} className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5">
                      Continue to payment
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
                  <h2 className="font-heading text-xl">Payment</h2>
                  <p className="text-sm text-[#6B6B6B]">Pay securely with Razorpay — UPI, Cards, Net Banking, and Wallets.</p>
                  {(["razorpay"] as PaymentMethodId[]).map((m) => (
                    <label key={m} className="flex items-center gap-3 rounded-xl border border-[#E8621A] bg-[#FFF7F2] p-4">
                      <input type="radio" checked readOnly />
                      <span className="font-semibold capitalize">Razorpay Checkout</span>
                    </label>
                  ))}
                  <label className="block text-sm">
                    <span className="font-medium">Coupon (optional)</span>
                    <input
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5"
                      placeholder="Try AKMCARE10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(3)} className="rounded-full border border-black/10 px-5 py-2.5 font-semibold">
                      Back
                    </button>
                    <button type="button" onClick={goNext} className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5">
                      Review order
                    </button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
                  <h2 className="font-heading text-xl">Review & pay</h2>
                  <p className="text-sm text-[#6B6B6B]">
                    Deliver to {draft.customer.name}, {draft.address.line1}, {draft.address.city}, {draft.address.state} — {draft.address.pincode}
                  </p>
                  <textarea
                    className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
                    rows={3}
                    placeholder="Order notes (optional)"
                    value={draft.notes}
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(4)} className="rounded-full border border-black/10 px-5 py-2.5 font-semibold">
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void placeOrder()}
                      className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 disabled:opacity-60"
                    >
                      {submitting ? "Processing…" : `Pay ${formatINR(checkoutTotals.orderTotal)}`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-black/[0.06] p-5 h-fit bg-[#FAF8F5] space-y-2 sticky top-24">
              <h2 className="font-heading text-lg mb-3">Order summary</h2>
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatINR(checkoutTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST (included display)</span>
                <span>{formatINR(checkoutTotals.gstTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{formatINR(shippingTotal)}</span>
              </div>
              {checkoutTotals.couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Coupon</span>
                  <span>-{formatINR(checkoutTotals.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t border-black/5 pt-3">
                <span>Total</span>
                <span className="text-[#E8621A]">{formatINR(checkoutTotals.orderTotal)}</span>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
