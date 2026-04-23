import { ShoppingCart, Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { submitProductInterest } from "@/lib/submissions";
import { SEO } from "@/components/SEO";
import { createRazorpayOrder, loadRazorpayScript, verifyRazorpayPayment } from "@/lib/paymentService";
import { isValidIndianPincode, mockDeliveryAvailable } from "@/lib/pincodeDelivery";
import type { ProductItem } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabaseClient";

const CATEGORY_FILTERS = ["All", "Food", "Organic", "Local"] as const;

function matchesProductFilter(cat: (typeof CATEGORY_FILTERS)[number], p: ProductItem): boolean {
  if (cat === "All") return true;
  const n = p.name.toLowerCase();
  if (cat === "Organic") return n.includes("organic");
  if (cat === "Food")
    return (
      n.includes("makhana") ||
      n.includes("sattu") ||
      n.includes("chana") ||
      n.includes("ghee") ||
      n.includes("honey")
    );
  if (cat === "Local") return true;
  return true;
}

const shopHeroImg =
  "/shop/shop-subheading-hero.png";

type CartLine = { product: ProductItem; quantity: number };

export default function Shop() {
  const [showNotify, setShowNotify] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkout, setCheckout] = useState({ name: "", email: "", phone: "" });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinStatus, setPinStatus] = useState<"idle" | "invalid" | "ok" | "no">("idle");
  const [productFilter, setProductFilter] = useState<(typeof CATEGORY_FILTERS)[number]>("All");
  const [cartSessionId] = useState(() => {
    const key = "akm_cart_session_id";
    try {
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const created = crypto.randomUUID();
      localStorage.setItem(key, created);
      return created;
    } catch {
      return "guest-session";
    }
  });
  const { data: products, loading } = useProducts();
  const reduce = useReducedMotion();

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesProductFilter(productFilter, p)),
    [products, productFilter],
  );
  const cartItemCount = useMemo(() => cartItems.reduce((acc, i) => acc + i.quantity, 0), [cartItems]);
  const cartTotal = useMemo(
    () => cartItems.reduce((acc, i) => acc + Number(i.product.price) * i.quantity, 0),
    [cartItems],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem("akm_cart_items");
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartLine[];
      if (Array.isArray(parsed)) setCartItems(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("akm_cart_items", JSON.stringify(cartItems));
    } catch {
      /* ignore */
    }
  }, [cartItems]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !cartSessionId) return;
    const sync = async () => {
      await client.from("cart_items").delete().eq("session_id", cartSessionId);
      if (cartItems.length === 0) return;
      await client.from("cart_items").insert(
        cartItems.map((line) => ({
          session_id: cartSessionId,
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      );
    };
    void sync();
  }, [cartItems, cartSessionId]);

  const checkPincode = () => {
    const p = pinInput.trim();
    if (!isValidIndianPincode(p)) {
      setPinStatus("invalid");
      return;
    }
    setPinStatus(mockDeliveryAvailable(p) ? "ok" : "no");
  };

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

  const handleBuyNow = (product: ProductItem) => {
    setPaymentError("");
    setCartItems([{ product, quantity: 1 }]);
    setShowCheckout(true);
  };

  const addToCart = (product: ProductItem, quantity = 1) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx === -1) return [...prev, { product, quantity }];
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        quantity: Math.min(10, next[idx].quantity + quantity),
      };
      return next;
    });
    setShowCart(true);
  };

  const updateQuantity = (productId: string, qty: number) => {
    setCartItems((prev) =>
      prev
        .map((line) => (line.product.id === productId ? { ...line, quantity: Math.max(1, Math.min(10, qty)) } : line))
        .filter((line) => line.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((line) => line.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setShowCart(false);
    setShowCheckout(false);
  };

  const openRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!checkout.name || !checkout.email) {
      toast.error("Please enter your name and email.");
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

      const checkoutItems = cartItems.map((line) => ({
        productId: line.product.id,
        productName: line.product.name,
        quantity: line.quantity,
        unitPrice: Number(line.product.price),
      }));
      const orderRes = await createRazorpayOrder(checkoutItems, checkout);
      if (!orderRes?.success) {
        toast.error(orderRes?.error || "Unable to create order.");
        return;
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: "AKM Care",
        description: `${cartItems.length} item(s)`,
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
            orderPayload: {
              items: checkoutItems,
              totalAmount: cartTotal,
              customer: {
                name: checkout.name,
                email: checkout.email,
                phone: checkout.phone,
              },
            },
          });

          if (!verify?.success) {
            const message = verify?.error || "Payment verification failed.";
            setPaymentError(message);
            toast.error(message);
            return;
          }
          toast.success("Payment successful! Order confirmed.");
          setCartItems([]);
          setShowCheckout(false);
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
    <>
      <SEO
        title="Shop — Authentic Village Products | Makhana, Sattu & More"
        description="Buy authentic rural Indian products online — premium Makhana (Fox Nuts), Sattu Powder, and more village produce. Sourced directly from Bihar villages, delivered pan-India."
        keywords="buy makhana online, sattu powder online, village products India, rural products buy, authentic makhana, Bihar products online, healthy snacks India"
        canonical="/shop"
      />
      <section className="section-padding pt-6 sm:pt-8 lg:pt-10 bg-[#F5F0EB]">
        <div className="container-premium grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[2.75rem] text-[#1A1A1A] leading-tight mb-4">
              Authentic Village Products
            </h1>
            <p className="text-lg text-[#6B6B6B]">
              We sell online, Authentic Various Domestic Food Items, Fancy Sarees & Textile Products.
            </p>
          </div>
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <img
              src={shopHeroImg}
              alt=""
              width={900}
              height={560}
              loading="eager"
              decoding="async"
              className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-2xl border border-black/[0.06] shadow-lg"
              aria-hidden
            />
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-6">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setProductFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  productFilter === f
                    ? "bg-[#E8621A] text-white shadow-md"
                    : "bg-[#FAF8F5] border border-black/[0.08] text-[#6B6B6B] hover:border-[#E8621A]/30"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="max-w-xl mx-auto lg:mx-0 mb-8 bg-white rounded-2xl border border-black/[0.08] p-5 sm:p-6 shadow-sm">
            <h2 className="font-heading text-lg sm:text-xl mb-1 text-center">Check Delivery Availability by Pincode</h2>
            <p className="text-sm text-muted-foreground text-center mb-4">Enter your 6-digit Indian pincode</p>
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
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
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

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-card rounded-2xl overflow-hidden card-shadow premium-card">
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
                    <span className="text-5xl">
                      {product.name.includes("Makhana") ? "🫘" : product.name.includes("Sattu") ? "🌾" : product.name.includes("Honey") ? "🍯" : product.name.includes("Ghee") ? "🧈" : "🫘"}
                    </span>
                  )}
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${product.status === "sold_out" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {(product.stock_quantity ?? 0) > 0 ? `In Stock (${product.stock_quantity})` : "Out of Stock"}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-base mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{product.quantity}</p>
                  <p className="text-xs text-muted-foreground mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xl text-[#E8621A]">₹{product.price}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={(product.stock_quantity ?? 0) === 0}
                      className={`p-2.5 rounded-xl ${(product.stock_quantity ?? 0) === 0 ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground"}`}
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleBuyNow(product)}
                    disabled={(product.stock_quantity ?? 0) === 0}
                    className={`mt-3 w-full py-2 rounded-full text-sm font-semibold transition-all ${(product.stock_quantity ?? 0) === 0 ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:brightness-110"}`}
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(product.name);
                      setShowNotify(true);
                    }}
                    className="mt-3 w-full py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
                  >
                    Notify me when available
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}

          <div className="text-center mt-12">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setShowCart(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
              >
                <ShoppingCart size={18} /> View Cart ({cartItemCount})
              </button>
              <button
                onClick={() => setShowNotify(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-all"
              >
                <Bell size={18} /> Notify Me When Available
              </button>
            </div>
          </div>
        </div>
      </section>

      {showNotify && (
        <div className="fixed inset-0 z-[100] bg-foreground/50 flex items-center justify-center p-4" onClick={() => setShowNotify(false)}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-2xl mb-2">Get Notified</h3>
            <p className="text-muted-foreground mb-6">Enter your email and we'll let you know when products are available.</p>
            <form onSubmit={handleNotify} className="space-y-4">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="text" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} placeholder="Product name" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button type="submit" className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all">
                Notify Me
              </button>
            </form>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-[110] bg-foreground/50 flex items-center justify-center p-4" onClick={() => setShowCart(false)}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-2xl mb-2">Your Cart</h3>
            <p className="text-muted-foreground mb-6">Review your items before checkout.</p>
            <div className="max-h-64 overflow-auto space-y-3 mb-5">
              {cartItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              ) : (
                cartItems.map((line) => (
                  <div key={line.product.id} className="rounded-2xl border border-border/70 bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-heading text-base line-clamp-1">{line.product.name}</div>
                        <div className="text-sm text-muted-foreground">{line.product.quantity}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                            className="h-7 w-7 rounded-full border border-border text-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold w-5 text-center">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                            className="h-7 w-7 rounded-full border border-border text-sm"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(line.product.id)}
                            className="ml-2 text-xs text-destructive font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="font-semibold text-lg">₹{Number(line.product.price) * line.quantity}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mb-4 flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>₹{cartTotal}</span>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCart(false);
                  if (cartItems.length > 0) setShowCheckout(true);
                }}
                disabled={cartItems.length === 0}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
              >
                Proceed to Checkout
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full py-3 rounded-full bg-muted text-muted-foreground font-semibold hover:brightness-105 transition-all"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && cartItems.length > 0 && (
        <div className="fixed inset-0 z-[120] bg-foreground/50 flex items-center justify-center p-4" onClick={() => { setShowCheckout(false); setPaymentError(""); }}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-2xl mb-2">Quick Checkout</h3>
            <p className="text-muted-foreground mb-4">{cartItems.length} item(s) - ₹{cartTotal}</p>
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
                  <button type="button" onClick={() => { setShowCheckout(false); setPaymentError(""); }} className="flex-1 py-2 rounded-full bg-muted text-muted-foreground text-sm font-semibold">Cancel</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
