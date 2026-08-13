import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
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
import { listAddresses, saveAddress, type Address } from "@/services/addressService";
import { markOrderFailed } from "@/services/orderService";
import { createRazorpayOrder, loadRazorpayScript, verifyRazorpayPayment } from "@/lib/paymentService";
import { sendOrderEmail } from "@/lib/emailService";
import { productPath } from "@/lib/ecommerce/slug";

const STEPS = ["Cart", "Customer", "Address", "Shipping", "Payment", "Review"] as const;
type StepIndex = 1 | 2 | 3 | 4 | 5 | 6;

const CHECKOUT_STORAGE_KEY = "akm_checkout_draft_v2";

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

type FieldErrors = Record<string, string>;

type PersistedCheckout = {
  step: StepIndex;
  draft: CheckoutDraft;
  addressLabel: "home" | "office" | "other";
  saveAddressForLater: boolean;
};

function shippingWindowLabel(minDays: number, maxDays: number) {
  return `${minDays}–${maxDays} business days (estimate)`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  return /^[6-9]\d{9}$/.test(value.replace(/\s+/g, ""));
}

function loadPersisted(): PersistedCheckout | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedCheckout;
  } catch {
    return null;
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, session } = useAuth();
  const {
    items,
    checkoutTotals,
    clearCart,
    couponCode,
    setCouponCode,
    shippingMethod,
    setShippingMethod,
    shippingTotal,
    shippingConfig,
    updateQuantity,
    removeFromCart,
    refreshCartFromCatalog,
  } = useCart();

  const persisted = useMemo(() => loadPersisted(), []);
  const cartFingerprint = useMemo(
    () => items.map((i) => `${i.productId}:${i.quantity}:${i.unitPrice}`).join("|"),
    [items],
  );

  const [step, setStep] = useState<StepIndex>(() => {
    const p = loadPersisted();
    if (!p?.step || p.step > 6) return 1;
    return p.step >= 6 ? 5 : p.step;
  });
  const [submitting, setSubmitting] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<
    "idle" | "creating" | "opening" | "processing" | "verifying"
  >("idle");
  const submitLockRef = useRef(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [addressLabel, setAddressLabel] = useState<"home" | "office" | "other">(
    persisted?.addressLabel || "home",
  );
  const [saveAddressForLater, setSaveAddressForLater] = useState(persisted?.saveAddressForLater ?? true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<CheckoutDraft>(
    persisted?.draft || {
      customer: {
        name: profile?.full_name || "",
        email: user?.email || "",
        phone: profile?.phone || "",
      },
      address: { line1: "", line2: "", city: "", state: "Gujarat", pincode: "", country: "India" },
      shippingMethod: "standard",
      paymentMethod: "razorpay",
      notes: "",
    },
  );

  useEffect(() => {
    if (persisted?.draft?.couponCode) setCouponCode(persisted.draft.couponCode);
    // Invalidate stale draft step if cart contents changed since last persist
    try {
      const storedFp = sessionStorage.getItem("akm_checkout_cart_fp");
      if (storedFp && storedFp !== cartFingerprint && items.length > 0) {
        setStep(1);
      }
      if (items.length > 0) sessionStorage.setItem("akm_checkout_cart_fp", cartFingerprint);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (items.length > 0) sessionStorage.setItem("akm_checkout_cart_fp", cartFingerprint);
    } catch {
      /* ignore */
    }
  }, [cartFingerprint, items.length]);

  useEffect(() => {
    if (!user) return;
    void listAddresses(user.id)
      .then((rows) => {
        setSavedAddresses(rows);
        const def = rows.find((a) => a.is_default) || rows[0];
        if (def && !persisted?.draft?.address?.line1) {
          applyAddress(def);
          setSelectedSavedId(def.id);
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    const payload: PersistedCheckout = {
      step,
      draft: { ...draft, couponCode },
      addressLabel,
      saveAddressForLater,
    };
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
  }, [step, draft, addressLabel, saveAddressForLater, couponCode]);

  const crumbs = shopBreadcrumbs([
    { name: "Cart", url: "/cart" },
    { name: "Checkout", url: "/checkout" },
  ]);

  const applyAddress = (a: Address) => {
    setSelectedSavedId(a.id);
    setAddressLabel(a.label);
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
    setErrors((e) => {
      const next = { ...e };
      delete next.line1;
      delete next.city;
      delete next.state;
      delete next.pincode;
      return next;
    });
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

  const markTouched = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const validateCustomerFields = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!draft.customer.name.trim() || draft.customer.name.trim().length < 2) {
      next.name = "Enter your full name.";
    }
    if (!draft.customer.email.trim()) next.email = "Enter your email address.";
    else if (!isValidEmail(draft.customer.email)) next.email = "Enter a valid email address.";
    if (!draft.customer.phone.trim()) next.phone = "Enter your mobile number.";
    else if (!isValidPhone(draft.customer.phone)) next.phone = "Enter a valid 10-digit Indian mobile number.";
    return next;
  };

  const validateAddressFields = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!draft.address.line1.trim()) next.line1 = "Address line 1 is required.";
    if (!draft.address.city.trim()) next.city = "City is required.";
    if (!draft.address.state.trim()) next.state = "State is required.";
    if (!draft.address.pincode.trim()) next.pincode = "Pincode is required.";
    else if (!isValidIndianPincode(draft.address.pincode)) next.pincode = "Enter a valid 6-digit pincode.";
    return next;
  };

  const showStepErrors = (keys: string[], errs: FieldErrors) => {
    setTouched((t) => {
      const copy = { ...t };
      for (const k of keys) copy[k] = true;
      return copy;
    });
    setErrors((e) => {
      const copy = { ...e };
      for (const k of keys) {
        if (errs[k]) copy[k] = errs[k];
        else delete copy[k];
      }
      return copy;
    });
  };

  const blurField = (key: string, errs: FieldErrors) => {
    markTouched(key);
    setErrors((e) => {
      const copy = { ...e };
      if (errs[key]) copy[key] = errs[key];
      else delete copy[key];
      return copy;
    });
  };

  const fieldError = (key: string) => (touched[key] ? errors[key] : undefined);

  const updateCustomer = (key: keyof CheckoutDraft["customer"], value: string) => {
    setDraft((d) => ({ ...d, customer: { ...d.customer, [key]: value } }));
    setErrors((e) => {
      const copy = { ...e };
      delete copy[key];
      return copy;
    });
  };

  const updateAddress = (key: keyof CheckoutDraft["address"], value: string) => {
    setSelectedSavedId(null);
    setDraft((d) => ({ ...d, address: { ...d.address, [key]: value } }));
    setErrors((e) => {
      const copy = { ...e };
      delete copy[key];
      return copy;
    });
  };

  const goNext = async () => {
    if (items.length === 0) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      const errs = validateCustomerFields();
      showStepErrors(["name", "email", "phone"], errs);
      if (Object.keys(errs).length) return;
      setStep(3);
      return;
    }

    if (step === 3) {
      const errs = validateAddressFields();
      showStepErrors(["line1", "city", "state", "pincode"], errs);
      if (Object.keys(errs).length) return;
      if (isAuthenticated && user && saveAddressForLater && !selectedSavedId) {
        try {
          await saveAddress(user.id, {
            label: addressLabel,
            full_name: draft.customer.name.trim(),
            phone: draft.customer.phone.trim(),
            pincode: draft.address.pincode.trim(),
            state: draft.address.state,
            city: draft.address.city.trim(),
            area: draft.address.line1.trim(),
            landmark: draft.address.line2?.trim() || null,
            is_default: savedAddresses.length === 0,
          });
          const rows = await listAddresses(user.id);
          setSavedAddresses(rows);
        } catch {
          /* non-blocking — still continue checkout */
        }
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      setStep(5);
      return;
    }

    if (step === 5) {
      setStep(6);
    }
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1) as StepIndex);

  const jumpTo = (target: StepIndex) => {
    if (target >= step) return;
    setStep(target);
  };

  const placeOrder = async () => {
    if (submitLockRef.current || submitting) return;

    const customerErrs = validateCustomerFields();
    const addressErrs = validateAddressFields();
    if (Object.keys(customerErrs).length || Object.keys(addressErrs).length) {
      if (Object.keys(customerErrs).length) {
        showStepErrors(["name", "email", "phone"], customerErrs);
        setStep(2);
        window.setTimeout(() => document.getElementById("checkout-field-name")?.focus(), 50);
      } else {
        showStepErrors(["line1", "city", "state", "pincode"], addressErrs);
        setStep(3);
        window.setTimeout(() => document.getElementById("checkout-field-line1")?.focus(), 50);
      }
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setPaymentPhase("creating");
    let orderHeaderId: string | null = null;
    let accessToken: string | null = null;
    const unlock = () => {
      setPaymentPhase("idle");
      setSubmitting(false);
      submitLockRef.current = false;
    };
    try {
      if (draft.paymentMethod === "cod") {
        toast.error("Cash on Delivery is coming soon. Please pay with Razorpay.");
        unlock();
        return;
      }

      if (draft.paymentMethod !== "razorpay") {
        toast.error("Please select Razorpay to continue.");
        unlock();
        return;
      }

      const refresh = await refreshCartFromCatalog();
      if (refresh.unavailableNames.length) {
        toast.error("Some items are no longer available. Please review your cart.");
        setStep(1);
        unlock();
        return;
      }
      if (refresh.priceChanged || refresh.stockChanged) {
        toast.message("Your cart has changed. Please review it before continuing.");
        setStep(1);
        unlock();
        return;
      }
      if (items.length === 0) {
        toast.error("Your cart is empty.");
        unlock();
        return;
      }

      const ready = await loadRazorpayScript();
      if (!ready) {
        toast.error("Could not load Razorpay. Check your connection.");
        unlock();
        return;
      }

      setPaymentPhase("opening");
      const created = await createRazorpayOrder({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          colorName: i.colorName,
          variantName: i.variantName,
        })),
        customer: draft.customer,
        address: addressPayload,
        shippingMethod,
        couponCode: couponCode || undefined,
        notes: draft.notes,
        accessToken: session?.access_token,
      });

      if (!created?.success || !created.order || !created.orderHeaderId || !created.accessToken) {
        toast.error(created?.error || "We couldn't start the payment. Please try again.");
        unlock();
        return;
      }

      orderHeaderId = created.orderHeaderId;
      accessToken = created.accessToken;

      if (
        created.totals &&
        Math.abs(Number(created.totals.grandTotal) - checkoutTotals.orderTotal) > 1
      ) {
        toast.message(
          `Final amount ${formatINR(Number(created.totals.grandTotal))} (server-verified). Opening secure payment…`,
        );
      }

      setPaymentPhase("processing");
      const rzp = new window.Razorpay({
        key: created.keyId,
        amount: created.order.amount,
        currency: created.order.currency || "INR",
        name: "AKM Care",
        description: `Order ${created.orderNumber}`,
        order_id: created.order.id,
        prefill: {
          name: draft.customer.name,
          email: draft.customer.email,
          contact: draft.customer.phone,
        },
        theme: { color: "#E8621A" },
        modal: {
          ondismiss: async () => {
            toast.message("Payment cancelled. You can try again when ready.");
            if (orderHeaderId && accessToken) {
              await markOrderFailed(orderHeaderId, accessToken, "payment cancelled / dismissed");
            }
            setPaymentPhase("idle");
            setSubmitting(false);
            submitLockRef.current = false;
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setPaymentPhase("verifying");
          try {
            const verified = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderHeaderId: created.orderHeaderId!,
              accessToken: created.accessToken!,
            });

            if (!verified?.success) {
              toast.error(verified?.error || "Payment verification failed. Please contact support if money was deducted.");
              await markOrderFailed(
                created.orderHeaderId!,
                created.accessToken!,
                verified?.error || "verify failed",
              );
              setPaymentPhase("idle");
              setSubmitting(false);
              submitLockRef.current = false;
              return;
            }

            try {
              await sendOrderEmail("payment_success", {
                orderNumber: created.orderNumber,
                customer: draft.customer,
                paymentId: response.razorpay_payment_id,
                amount: verified.amount ?? created.amount,
              });
            } catch {
              /* notification failure must not reverse payment */
            }

            clearCart();
            localStorage.removeItem(CHECKOUT_STORAGE_KEY);
            toast.success("Payment successful");
            navigate(
              `/order-success?order=${encodeURIComponent(created.orderNumber || "")}&token=${encodeURIComponent(created.accessToken!)}`,
              { replace: true },
            );
          } catch (err) {
            toast.error(
              err instanceof Error
                ? err.message
                : "Payment verification is taking longer than expected. Check My Account or contact support.",
            );
            await markOrderFailed(created.orderHeaderId!, created.accessToken!, "callback error");
            setPaymentPhase("idle");
            setSubmitting(false);
            submitLockRef.current = false;
          }
        },
      });

      rzp.on("payment.failed", async (resp: { error?: { description?: string } }) => {
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
        if (orderHeaderId && accessToken) {
          await markOrderFailed(orderHeaderId, accessToken, resp?.error?.description || "payment.failed");
        }
        setPaymentPhase("idle");
        setSubmitting(false);
        submitLockRef.current = false;
      });

      rzp.open();
      // Keep submitting=true while Razorpay modal is open (released on dismiss/fail/success)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't start the payment. Please try again.");
      if (orderHeaderId && accessToken) {
        await markOrderFailed(orderHeaderId, accessToken, "checkout exception");
      }
      setPaymentPhase("idle");
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (items.length === 0) {
    return (
      <>
        <SEO
          title="Checkout"
          description="Secure AKM Care checkout."
          canonical="/checkout"
          robots="noindex, follow"
        />
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
      <SEO
        title="Checkout"
        description="Secure AKM Care checkout with Razorpay."
        canonical="/checkout"
        robots="noindex, follow"
      />
      <section className="section-padding bg-white pt-6">
        <div className="container-premium">
          <ShopBreadcrumbs items={crumbs} className="mb-6" />
          <h1 className="font-heading text-3xl sm:text-4xl mb-6">Checkout</h1>

          <ol className="flex flex-wrap gap-2 mb-8" aria-label="Checkout progress">
            {STEPS.map((label, i) => {
              const n = (i + 1) as StepIndex;
              const active = step === n;
              const done = step > n;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => jumpTo(n)}
                    disabled={!done}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
                      active
                        ? "bg-[#E8621A] text-white border-[#E8621A]"
                        : done
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:brightness-95"
                          : "bg-white border-black/10 text-[#6B6B6B] opacity-70 cursor-default",
                    )}
                  >
                    {n}. {label}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-6">
              {step === 1 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 bg-[#FAF8F5] space-y-4">
                  <h2 className="font-heading text-xl">Cart review</h2>
                  {items.map((line) => (
                    <div
                      key={`${line.productId}-${line.colorId}-${line.variantId}`}
                      className="flex gap-3 items-start rounded-xl border border-black/5 bg-white p-3"
                    >
                      <Link
                        to={productPath(line.slug)}
                        className="h-16 w-14 rounded-lg overflow-hidden bg-[#FAF8F5] shrink-0"
                      >
                        <img src={line.image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-2">{line.name}</p>
                        <p className="text-xs text-[#6B6B6B] mt-0.5">
                          {line.colorName || line.variantName
                            ? [line.colorName, line.variantName].filter(Boolean).join(" · ")
                            : line.sku}
                        </p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <div className="inline-flex items-center gap-1 rounded-full border border-black/10 px-1 py-0.5">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              className="h-7 w-7 rounded-full flex items-center justify-center"
                              onClick={() =>
                                updateQuantity(line.productId, line.quantity - 1, line.colorId, line.variantId)
                              }
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">{line.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              className="h-7 w-7 rounded-full flex items-center justify-center"
                              onClick={() =>
                                updateQuantity(line.productId, line.quantity + 1, line.colorId, line.variantId)
                              }
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="text-xs font-semibold text-destructive inline-flex items-center gap-1"
                            onClick={() => removeFromCart(line.productId, line.colorId, line.variantId)}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                      <span className="font-semibold text-sm shrink-0">
                        {formatINR(line.unitPrice * line.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      to="/shop"
                      className="rounded-full border border-black/10 bg-white px-5 py-2.5 font-semibold text-sm"
                    >
                      Continue shopping
                    </Link>
                    <button
                      type="button"
                      onClick={() => void goNext()}
                      className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
                  <h2 className="font-heading text-xl">Customer information</h2>
                  <p className="text-sm text-[#6B6B6B]">We’ll use these details for order updates and delivery.</p>
                  <div className="space-y-3">
                    <Field
                      id="checkout-field-name"
                      label="Full name"
                      required
                      error={fieldError("name")}
                      value={draft.customer.name}
                      onBlur={() => blurField("name", validateCustomerFields())}
                      onChange={(v) => updateCustomer("name", v)}
                      autoComplete="name"
                    />
                    <Field
                      id="checkout-field-email"
                      label="Email address"
                      type="email"
                      required
                      error={fieldError("email")}
                      value={draft.customer.email}
                      onBlur={() => blurField("email", validateCustomerFields())}
                      onChange={(v) => updateCustomer("email", v)}
                      autoComplete="email"
                    />
                    <Field
                      id="checkout-field-phone"
                      label="Mobile number"
                      type="tel"
                      required
                      error={fieldError("phone")}
                      value={draft.customer.phone}
                      onBlur={() => blurField("phone", validateCustomerFields())}
                      onChange={(v) => updateCustomer("phone", v.replace(/[^\d]/g, "").slice(0, 10))}
                      autoComplete="tel"
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <NavButtons onBack={goBack} onNext={() => void goNext()} nextLabel="Continue to address" />
                </div>
              )}

              {step === 3 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-heading text-xl">Delivery address</h2>
                    {!isAuthenticated && (
                      <Link to="/auth" state={{ from: "/checkout" }} className="text-xs font-semibold text-[#E8621A]">
                        Sign in for saved addresses
                      </Link>
                    )}
                  </div>

                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Saved addresses</p>
                      {savedAddresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => applyAddress(a)}
                          className={cn(
                            "w-full text-left rounded-xl border p-3 text-sm transition-colors",
                            selectedSavedId === a.id
                              ? "border-[#E8621A] bg-[#FFF7F2]"
                              : "border-black/10 hover:border-[#E8621A]/40",
                          )}
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
                    <div className="sm:col-span-2">
                      <Field
                        id="checkout-field-line1"
                        label="Address line 1"
                        required
                        error={fieldError("line1")}
                        value={draft.address.line1}
                        onBlur={() => blurField("line1", validateAddressFields())}
                        onChange={(v) => updateAddress("line1", v)}
                        autoComplete="address-line1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Field
                        label="Address line 2 / Landmark"
                        value={draft.address.line2 || ""}
                        onChange={(v) => updateAddress("line2", v)}
                        autoComplete="address-line2"
                      />
                    </div>
                    <Field
                      label="City"
                      required
                      error={fieldError("city")}
                      value={draft.address.city}
                      onBlur={() => blurField("city", validateAddressFields())}
                      onChange={(v) => updateAddress("city", v)}
                      autoComplete="address-level2"
                    />
                    <label className="text-sm block">
                      <span className="font-medium">
                        State <span className="text-[#E8621A]">*</span>
                      </span>
                      <select
                        className={cn(
                          "mt-1 w-full rounded-xl border px-3 py-2.5 bg-white",
                          fieldError("state") ? "border-red-400" : "border-black/10",
                        )}
                        value={draft.address.state}
                        onChange={(e) => updateAddress("state", e.target.value)}
                        onBlur={() => blurField("state", validateAddressFields())}
                      >
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {fieldError("state") && <p className="mt-1 text-xs text-red-600">{fieldError("state")}</p>}
                    </label>
                    <Field
                      label="Pincode"
                      required
                      error={fieldError("pincode")}
                      value={draft.address.pincode}
                      onBlur={() => blurField("pincode", validateAddressFields())}
                      onChange={(v) => updateAddress("pincode", v.replace(/\D/g, "").slice(0, 6))}
                      autoComplete="postal-code"
                    />
                    <fieldset className="sm:col-span-2">
                      <legend className="text-sm font-medium mb-2">Address type</legend>
                      <div className="flex flex-wrap gap-2">
                        {(["home", "office", "other"] as const).map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setAddressLabel(label)}
                            className={cn(
                              "rounded-full px-4 py-2 text-xs font-semibold border capitalize",
                              addressLabel === label
                                ? "bg-[#E8621A] text-white border-[#E8621A]"
                                : "bg-white border-black/10",
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    {isAuthenticated && (
                      <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={saveAddressForLater}
                          onChange={(e) => setSaveAddressForLater(e.target.checked)}
                        />
                        Save this address to my account
                      </label>
                    )}
                  </div>
                  <NavButtons onBack={goBack} onNext={() => void goNext()} nextLabel="Continue to shipping" />
                </div>
              )}

              {step === 4 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
                  <h2 className="font-heading text-xl">Shipping method</h2>
                  {(
                    [
                      {
                        id: "standard" as const,
                        label: "Standard Delivery",
                        detail: "3–5 business days",
                        eta: shippingWindowLabel(3, 5),
                        price: 49,
                      },
                      {
                        id: "express" as const,
                        label: "Express Delivery",
                        detail: "1–2 business days",
                        eta: shippingWindowLabel(1, 2),
                        price: 99,
                      },
                    ]
                  ).map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex items-start justify-between gap-3 rounded-xl border p-4 cursor-pointer",
                        shippingMethod === opt.id ? "border-[#E8621A] bg-[#FFF7F2]" : "border-black/10",
                      )}
                    >
                      <span className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="ship"
                          className="mt-1"
                          checked={shippingMethod === opt.id}
                          onChange={() => {
                            setShippingMethod(opt.id);
                            setDraft((d) => ({ ...d, shippingMethod: opt.id }));
                          }}
                        />
                        <span>
                          <span className="font-semibold block">{opt.label}</span>
                          <span className="text-xs text-[#6B6B6B] block">{opt.detail}</span>
                          <span className="text-xs text-[#6B6B6B] block mt-0.5">Est. {opt.eta}</span>
                        </span>
                      </span>
                      <span className="font-semibold shrink-0">{formatINR(opt.price)}</span>
                    </label>
                  ))}
                  <NavButtons onBack={goBack} onNext={() => void goNext()} nextLabel="Continue to payment" />
                </div>
              )}

              {step === 5 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-4">
                  <h2 className="font-heading text-xl">Payment</h2>
                  <p className="text-sm text-[#6B6B6B]">
                    Razorpay supports UPI, Cards, Net Banking, and Wallets at payment time.
                  </p>
                  {(
                    [
                      {
                        id: "razorpay" as PaymentMethodId,
                        label: "Razorpay",
                        hint: "UPI · Cards · Net Banking · Wallet",
                        enabled: true,
                      },
                      {
                        id: "cod" as PaymentMethodId,
                        label: "Cash on Delivery",
                        hint: "Coming soon",
                        enabled: false,
                      },
                    ]
                  ).map((m) => (
                    <label
                      key={m.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4",
                        m.enabled && draft.paymentMethod === m.id
                          ? "border-[#E8621A] bg-[#FFF7F2]"
                          : "border-black/10",
                        !m.enabled && "opacity-60 cursor-not-allowed",
                      )}
                    >
                      <input
                        type="radio"
                        name="pay"
                        className="mt-1"
                        disabled={!m.enabled}
                        checked={draft.paymentMethod === m.id}
                        onChange={() => setDraft((d) => ({ ...d, paymentMethod: m.id }))}
                      />
                      <span>
                        <span className="font-semibold block">{m.label}</span>
                        <span className="text-xs text-[#6B6B6B]">{m.hint}</span>
                      </span>
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
                  <NavButtons onBack={goBack} onNext={() => void goNext()} nextLabel="Review order" />
                </div>
              )}

              {step === 6 && (
                <div className="rounded-2xl border border-black/[0.06] p-5 space-y-5">
                  <h2 className="font-heading text-xl">Review order</h2>

                  <ReviewBlock title="Products" onEdit={() => setStep(1)}>
                    <ul className="space-y-2 text-sm">
                      {items.map((line) => (
                        <li
                          key={`${line.productId}-${line.colorId}-${line.variantId}`}
                          className="flex justify-between gap-3"
                        >
                          <span>
                            {line.name} × {line.quantity}
                          </span>
                          <span className="font-semibold">{formatINR(line.unitPrice * line.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </ReviewBlock>

                  <ReviewBlock title="Customer" onEdit={() => setStep(2)}>
                    <p className="text-sm">
                      {draft.customer.name}
                      <br />
                      {draft.customer.email}
                      <br />
                      {draft.customer.phone}
                    </p>
                  </ReviewBlock>

                  <ReviewBlock title="Delivery address" onEdit={() => setStep(3)}>
                    <p className="text-sm capitalize text-[#E8621A] font-semibold mb-1">{addressLabel}</p>
                    <p className="text-sm text-[#6B6B6B]">
                      {draft.address.line1}
                      {draft.address.line2 ? `, ${draft.address.line2}` : ""}
                      <br />
                      {draft.address.city}, {draft.address.state} — {draft.address.pincode}
                    </p>
                  </ReviewBlock>

                  <ReviewBlock title="Shipping" onEdit={() => setStep(4)}>
                    <p className="text-sm">
                      {shippingMethod === "express" ? "Express Delivery" : "Standard Delivery"} ·{" "}
                      {formatINR(shippingTotal)}
                      <br />
                      <span className="text-[#6B6B6B]">
                        Est. {shippingMethod === "express" ? shippingWindowLabel(1, 2) : shippingWindowLabel(3, 5)}
                      </span>
                    </p>
                  </ReviewBlock>

                  <ReviewBlock title="Payment & totals" onEdit={() => setStep(5)}>
                    <div className="text-sm space-y-1">
                      <p className="capitalize">Method: {draft.paymentMethod}</p>
                      <p>Subtotal: {formatINR(checkoutTotals.subtotal)}</p>
                      <p>GST (included display): {formatINR(checkoutTotals.gstTotal)}</p>
                      <p>Shipping: {formatINR(shippingTotal)}</p>
                      {checkoutTotals.couponDiscount > 0 && (
                        <p className="text-emerald-700">Discount: −{formatINR(checkoutTotals.couponDiscount)}</p>
                      )}
                      {couponCode && <p>Coupon: {couponCode}</p>}
                      <p className="font-semibold text-[#E8621A] pt-1">
                        Grand total: {formatINR(checkoutTotals.orderTotal)}
                      </p>
                    </div>
                  </ReviewBlock>

                  <label className="block text-sm">
                    <span className="font-medium">Order notes (optional)</span>
                    <textarea
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
                      rows={3}
                      placeholder="Delivery instructions, gift note…"
                      value={draft.notes}
                      onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={goBack}
                      className="rounded-full border border-black/10 px-5 py-2.5 font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void placeOrder()}
                      className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 disabled:opacity-60 min-h-11"
                    >
                      {paymentPhase === "creating" && "Creating order…"}
                      {paymentPhase === "opening" && "Opening secure payment…"}
                      {paymentPhase === "processing" && "Payment processing…"}
                      {paymentPhase === "verifying" && "Verifying payment…"}
                      {paymentPhase === "idle" &&
                        (submitting
                          ? "Please wait…"
                          : `Place order · ${formatINR(checkoutTotals.orderTotal)}`)}
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
                <span>
                  {shippingTotal === 0
                    ? checkoutTotals.subtotal >= shippingConfig.freeAbove
                      ? "Free"
                      : formatINR(0)
                    : formatINR(shippingTotal)}
                </span>
              </div>
              {couponCode.trim() && (
                <div className="flex justify-between text-sm text-[#6B6B6B]">
                  <span>Coupon</span>
                  <span>{couponCode.trim().toUpperCase()} (verified at payment)</span>
                </div>
              )}
              <p className="text-[11px] text-[#6B6B6B] pt-1">
                Final total is confirmed by the secure payment server. Free shipping above{" "}
                {formatINR(shippingConfig.freeAbove)}.
              </p>
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

function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  required,
  type = "text",
  autoComplete,
  placeholder,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  id?: string;
}) {
  const inputId = id || `checkout-field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="text-sm block" htmlFor={inputId}>
      <span className="font-medium">
        {label}
        {required ? <span className="text-[#E8621A]"> *</span> : null}
      </span>
      <input
        id={inputId}
        type={type}
        className={cn(
          "mt-1 w-full rounded-xl border px-3 py-2.5 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35",
          error ? "border-red-400" : "border-black/10",
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <button type="button" onClick={onBack} className="rounded-full border border-black/10 px-5 py-2.5 font-semibold">
        Back
      </button>
      <button type="button" onClick={onNext} className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5">
        {nextLabel}
      </button>
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/10 p-4 bg-[#FAF8F5]">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-[#E8621A] inline-flex items-center gap-1"
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}
