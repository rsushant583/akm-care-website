import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { createRazorpayOrder, loadRazorpayScript, verifyRazorpayPayment } from "@/lib/paymentService";

export default function EcommercePreview() {
  const { ref, isVisible } = useScrollAnimation();
  const { data: products, loading } = useProducts();
  const [selectedBuyProduct, setSelectedBuyProduct] = useState<any>(null);
  const [checkout, setCheckout] = useState({ name: "", email: "", phone: "" });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

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
    <section className="section-padding bg-gradient-to-b from-background to-warm-beige/40">
      <div className="container-premium">
        <div className="text-center mb-14">
          <div className="inline-flex items-center rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-semibold mb-4">
            Village Store
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-4">
            From the Heart of India's Villages
          </h2>
          <p className="text-muted-foreground text-lg">
            Authentic rural products, coming to your doorstep
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          )) : products.map((product, i) => (
            <div
              key={product.id}
              className={`group bg-card border border-border/60 rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover hover:-translate-y-1.5 hover:border-primary/30 transition-all duration-200 ${
                isVisible ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="aspect-square bg-gradient-to-br from-saffron-light to-accent flex items-center justify-center relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    width={400}
                    height={400}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">
                    {product.name.includes("Makhana") ? "🫘" :
                     product.name.includes("Sattu") ? "🌾" :
                     product.name.includes("Honey") ? "🍯" :
                     product.name.includes("Ghee") ? "🧈" : "🫘"}
                  </span>
                )}
                <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${
                  (product.stock_quantity ?? 0) === 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {(product.stock_quantity ?? 0) > 0 ? `In Stock (${product.stock_quantity})` : "Out of Stock"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-heading text-base mb-0.5">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{product.quantity}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">₹{product.price}</span>
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
                  className={`mt-3 w-full py-2 rounded-full text-sm font-semibold transition-all ${
                    (product.stock_quantity ?? 0) > 0
                      ? "bg-primary text-primary-foreground hover:brightness-110"
                      : "bg-primary/10 text-primary cursor-not-allowed"
                  }`}
                >
                  {(product.stock_quantity ?? 0) > 0 ? "Buy Now" : "Notify me when available"}
                </button>
              </div>
            </div>
          ))}
        </div>
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
