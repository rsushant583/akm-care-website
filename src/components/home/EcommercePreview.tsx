import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { createRazorpayOrder, loadRazorpayScript, verifyRazorpayPayment } from "@/lib/paymentService";
import { isValidIndianPincode, mockDeliveryAvailable } from "@/lib/pincodeDelivery";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/animations";

export default function EcommercePreview() {
  const { data: products, loading } = useProducts();
  const [selectedBuyProduct, setSelectedBuyProduct] = useState<any>(null);
  const [checkout, setCheckout] = useState({ name: "", email: "", phone: "" });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinStatus, setPinStatus] = useState<"idle" | "invalid" | "ok" | "no">("idle");

  const checkPincode = () => {
    const p = pinInput.trim();
    if (!isValidIndianPincode(p)) {
      setPinStatus("invalid");
      return;
    }
    setPinStatus(mockDeliveryAvailable(p) ? "ok" : "no");
  };

  const openRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyProduct) return;
    if (!checkout.name || !checkout.email) {
      toast.error("Please enter your name and email.");
      return;
    }
    if ((selectedBuyProduct.stock_quantity ?? 0) <= 0) {
      toast.error("This item is currently out of stock.");
      return;
    }

    setProcessingPayment(true);
    setPaymentError("");
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load payment gateway.");
        return;
      }

      const orderRes = await createRazorpayOrder(selectedBuyProduct, checkout);
      if (!orderRes?.success) {
        toast.error(orderRes?.error || "Unable to create order.");
        return;
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: "AKM Care",
        description: selectedBuyProduct.name,
        order_id: orderRes.order.id,
        prefill: {
          name: checkout.name,
          email: checkout.email,
          contact: checkout.phone,
        },
        handler: async function (response: any) {
          const verify = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderData: {
              product_id: selectedBuyProduct.id,
              product_name: selectedBuyProduct.name,
              amount: Number(selectedBuyProduct.price),
              currency: "INR",
              quantity: 1,
              customer_name: checkout.name,
              customer_email: checkout.email,
              customer_phone: checkout.phone,
              razorpay_order_id: response.razorpay_order_id,
              payment_status: "paid",
            },
          });

          if (!verify?.success) {
            toast.error(verify?.error || "Payment verification failed.");
            setPaymentError(verify?.error || "Payment verification failed.");
            return;
          }

          toast.success("Payment successful! Order confirmed.");
          setSelectedBuyProduct(null);
          setCheckout({ name: "", email: "", phone: "" });
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        const message = response?.error?.description || "Payment failed. Please try again.";
        setPaymentError(message);
        toast.error(message);
      });
      rzp.on("modal.closed", () => {
        if (!processingPayment) return;
        setPaymentError("Payment window closed. You can retry.");
      });
      rzp.open();
    } catch {
      toast.error("Payment could not be initiated.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <section className="section-padding section-shell bg-[var(--surface-cream)] min-h-0">
      <div className="container-premium">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid lg:grid-cols-[60%_1px_1fr] gap-6 items-center mb-14">
          <div>
          <div
            className="inline-flex items-center rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-semibold mb-4 label-kicker"
          >
            Village Store
          </div>
          <h2 className="text-[var(--size-h2)] mb-4">
            From the Heart of India's Villages
          </h2>
          <p className="text-muted-foreground text-lg">
            Authentic rural products, coming to your doorstep
          </p>
          </div>
          <div className="hidden lg:block h-20 w-px bg-black/10" />
          <p className="hidden lg:block text-[#787878] italic text-lg font-['Cormorant_Garamond']">From the heart of India's villages to your doorstep. Authentic. Unprocessed. Pure.</p>
        </motion.div>

        <div className="max-w-xl mx-auto mb-14 premium-surface p-5 sm:p-6">
          <h3 className="font-heading text-base sm:text-lg mb-1 text-center">Check Delivery Availability by Pincode</h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4">Enter your 6-digit Indian pincode</p>
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
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-base"
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
            <p className="text-sm text-destructive mt-3 text-center">Please enter a valid 6-digit pincode.</p>
          )}
          {pinStatus === "ok" && (
            <p className="text-sm font-medium text-emerald-700 mt-3 text-center">Delivery Available</p>
          )}
          {pinStatus === "no" && (
            <p className="text-sm font-medium text-destructive mt-3 text-center">Delivery Not Available</p>
          )}
        </div>

        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          )) : products.map((product) => (
            <motion.div
              key={product.id}
              variants={fadeUp}
              className="ecom-card group bg-white border border-black/5 rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-card)] transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="h-60 bg-[var(--surface-cream)] flex items-center justify-center relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    width={400}
                    height={400}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                ) : (
                  <span className="text-4xl">
                    {product.name.includes("Makhana") ? "🫘" :
                     product.name.includes("Sattu") ? "🌾" :
                     product.name.includes("Honey") ? "🍯" :
                     product.name.includes("Ghee") ? "🧈" : "🫘"}
                  </span>
                )}
                <span className={`absolute top-3 right-3 text-[11px] font-semibold uppercase tracking-[0.06em] px-3 py-1 rounded-full ${
                  (product.stock_quantity ?? 0) === 0
                    ? "bg-gray-100 text-gray-500 border border-gray-200"
                    : (product.stock_quantity ?? 0) <= 10
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}>
                  {(product.stock_quantity ?? 0) > 0 ? `In Stock (${product.stock_quantity})` : "Out of Stock"}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-[17px] font-medium mb-0.5">{product.name}</h3>
                <p className="text-[13px] text-muted-foreground mb-3">{product.quantity}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[26px] leading-none text-primary font-['Cormorant_Garamond']">₹{product.price}</span>
                  <button
                    onClick={() => {
                      setPaymentError("");
                      setSelectedBuyProduct(product);
                    }}
                    disabled={(product.stock_quantity ?? 0) === 0}
                    className={`p-2 rounded-xl ${
                      (product.stock_quantity ?? 0) === 0
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
                <div className="mt-3 mb-3">
                  <p className="text-[12px] text-muted-foreground mb-1">{(product.stock_quantity ?? 0)} of 50 available</p>
                  <div className="h-1 rounded-full bg-black/10"><div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.min(((product.stock_quantity ?? 0) / 50) * 100, 100)}%` }} /></div>
                </div>
                <button
                  onClick={() =>
                    (product.stock_quantity ?? 0) > 0
                      ? (() => {
                          setPaymentError("");
                          setSelectedBuyProduct(product);
                        })()
                      : null
                  }
                  disabled={(product.stock_quantity ?? 0) === 0}
                  className={`w-full h-[50px] rounded-[var(--radius-md)] text-sm font-semibold transition-all ${
                    (product.stock_quantity ?? 0) > 0
                      ? "bg-[#0A0A0A] text-primary-foreground hover:bg-primary"
                      : "bg-primary/10 text-primary cursor-not-allowed"
                  }`}
                >
                  {(product.stock_quantity ?? 0) > 0 ? "Buy Now" : "Notify me when available"}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
        {!loading && products.length === 0 && (
          <div className="text-center mt-8 text-muted-foreground">Products are being updated. Please check again shortly.</div>
        )}
      </div>

      {selectedBuyProduct && (
        <div className="fixed inset-0 z-[120] bg-foreground/50 flex items-center justify-center p-4" onClick={() => { setSelectedBuyProduct(null); setPaymentError(""); }}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-2xl mb-2">Quick Checkout</h3>
            <p className="text-muted-foreground mb-4">{selectedBuyProduct.name} - ₹{selectedBuyProduct.price}</p>
            <form onSubmit={openRazorpay} className="space-y-4">
              <input required type="text" value={checkout.name} onChange={(e) => setCheckout((p) => ({ ...p, name: e.target.value }))} placeholder="Your Name" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
              <input required type="email" value={checkout.email} onChange={(e) => setCheckout((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
              <input type="tel" value={checkout.phone} onChange={(e) => setCheckout((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone (optional)" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
              <button disabled={processingPayment} type="submit" className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all">
                {processingPayment ? "Processing..." : "Pay with Razorpay"}
              </button>
              {paymentError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-sm text-destructive mb-2">{paymentError}</p>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">Retry</button>
                    <button type="button" onClick={() => { setSelectedBuyProduct(null); setPaymentError(""); }} className="flex-1 py-2 rounded-full bg-muted text-muted-foreground text-sm font-semibold">Cancel</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
