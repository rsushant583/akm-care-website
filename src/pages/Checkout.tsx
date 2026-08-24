import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Minus, Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  addressesContentEqual,
  listAddresses,
  saveAddress,
  type Address,
} from "@/services/addressService";
import { CheckoutPincodeVerify } from "@/components/checkout/CheckoutPincodeVerify";
import { markOrderFailed } from "@/services/orderService";
import { createRazorpayOrder, isCheckoutAttemptKey, loadRazorpayScript, verifyRazorpayPayment } from "@/lib/paymentService";
import {
  trackBeginCheckout,
  trackPurchaseAfterVerify,
  trackPurchaseFromCreateResponse,
} from "@/lib/analytics/events";
import { sendOrderEmail } from "@/lib/emailService";
import { productPath } from "@/lib/ecommerce/slug";

const STEPS = ["Cart", "Details", "Address", "Delivery", "Payment", "Review"] as const;
type StepIndex = 1 | 2 | 3 | 4 | 5 | 6;

const CHECKOUT_STORAGE_KEY = "akm_checkout_draft_v2";
const CHECKOUT_ATTEMPT_KEY = "akm_checkout_attempt_v1";

type StoredCheckoutAttempt = { key: string; cartFp: string };

function readCheckoutAttempt(): StoredCheckoutAttempt | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_ATTEMPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCheckoutAttempt;
    if (!parsed?.key || !isCheckoutAttemptKey(parsed.key)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistCheckoutAttempt(key: string, cartFp: string) {
  try {
    localStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify({ key, cartFp }));
  } catch {
    /* ignore quota */
  }
}

/** Reuse the same attempt UUID across retry/refresh/tabs while the cart is unchanged. */
function getOrCreateCheckoutAttemptKey(cartFp: string) {
  const stored = readCheckoutAttempt();
  if (stored && stored.cartFp === cartFp) return stored.key;
  const key = crypto.randomUUID();
  persistCheckoutAttempt(key, cartFp);
  return key;
}

/** Call only when this payment attempt is consumed (dismiss, fail, paid, or server new_attempt_required). */
function rotateCheckoutAttemptKey(cartFp: string) {
  const key = crypto.randomUUID();
  persistCheckoutAttempt(key, cartFp);
  return key;
}

function clearCheckoutAttemptKey() {
  try {
    localStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
  } catch {
    /* ignore */
  }
}

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
  selectedSavedId: string | null;
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

function draftToAddressShape(
  draft: CheckoutDraft,
  label: "home" | "office" | "other",
): Pick<Address, "label" | "full_name" | "phone" | "pincode" | "state" | "city" | "area" | "landmark"> {
  return {
    label,
    full_name: draft.customer.name,
    phone: draft.customer.phone,
    pincode: draft.address.pincode,
    state: draft.address.state,
    city: draft.address.city,
    area: draft.address.line1,
    landmark: draft.address.line2 || null,
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion() === true;
  const { user, profile, isAuthenticated, session } = useAuth();
  const {
    items,
    checkoutTotals,
    clearCart,
    couponCode,
    setCouponCode,
    couponPreview,
    couponLoading,
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
  const addressSaveLockRef = useRef(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(
    persisted?.selectedSavedId ?? null,
  );
  const [addressLabel, setAddressLabel] = useState<"home" | "office" | "other">(
    persisted?.addressLabel || "home",
  );
  const [saveAddressForLater, setSaveAddressForLater] = useState(persisted?.saveAddressForLater ?? true);
  const [addressFormOpen, setAddressFormOpen] = useState(() => !persisted?.selectedSavedId);
  const [editingAddress, setEditingAddress] = useState(false);
  const [couponOpen, setCouponOpen] = useState(() => Boolean(persisted?.draft?.couponCode));
  const [summaryOpen, setSummaryOpen] = useState(false);
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

        const persistedId = selectedSavedId;
        if (persistedId) {
          const byId = rows.find((a) => a.id === persistedId);
          if (byId) {
            applyAddress(byId, { keepFormClosed: true });
            return;
          }
        }

        const line1 = draft.address.line1?.trim();
        if (line1) {
          const shape = draftToAddressShape(draft, addressLabel);
          const match = rows.find((row) => addressesContentEqual(row, shape));
          if (match) {
            setSelectedSavedId(match.id);
            setAddressFormOpen(false);
            setEditingAddress(false);
            return;
          }
          setAddressFormOpen(true);
          return;
        }

        const def = rows.find((a) => a.is_default) || rows[0];
        if (def) {
          applyAddress(def, { keepFormClosed: true });
        } else {
          setAddressFormOpen(true);
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

  const beginCheckoutTrackedRef = useRef(false);

  useEffect(() => {
    if (items.length === 0 || beginCheckoutTrackedRef.current) return;
    beginCheckoutTrackedRef.current = true;
    trackBeginCheckout(items, couponCode);
  }, [items, couponCode]);

  useEffect(() => {
    const payload: PersistedCheckout = {
      step,
      draft: { ...draft, couponCode },
      addressLabel,
      saveAddressForLater,
      selectedSavedId,
    };
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
  }, [step, draft, addressLabel, saveAddressForLater, couponCode, selectedSavedId]);

  const crumbs = shopBreadcrumbs([
    { name: "Cart", url: "/cart" },
    { name: "Checkout", url: "/checkout" },
  ]);

  const applyAddress = (a: Address, opts?: { keepFormClosed?: boolean }) => {
    setSelectedSavedId(a.id);
    setAddressLabel(a.label);
    if (opts?.keepFormClosed) {
      setAddressFormOpen(false);
      setEditingAddress(false);
    } else {
      setAddressFormOpen(false);
      setEditingAddress(false);
    }
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

  const addNewAddress = () => {
    setSelectedSavedId(null);
    setEditingAddress(false);
    setAddressFormOpen(true);
    setDraft((d) => ({
      ...d,
      address: {
        line1: "",
        line2: "",
        city: "",
        state: d.address.state || "Gujarat",
        pincode: "",
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

  /** Keep selectedSavedId so edits update the same saved record. */
  const updateAddress = (key: keyof CheckoutDraft["address"], value: string) => {
    setDraft((d) => ({ ...d, address: { ...d.address, [key]: value } }));
    setErrors((e) => {
      const copy = { ...e };
      delete copy[key];
      return copy;
    });
  };

  const showAddressForm =
    addressFormOpen || savedAddresses.length === 0 || editingAddress || !selectedSavedId;

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
      if (addressSaveLockRef.current) return;
      const errs = validateAddressFields();
      showStepErrors(["line1", "city", "state", "pincode"], errs);
      if (Object.keys(errs).length) return;

      addressSaveLockRef.current = true;
      try {
        if (saveAddressForLater && isAuthenticated && user) {
          try {
            const saved = await saveAddress(user.id, {
              id: selectedSavedId || undefined,
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
            setSelectedSavedId(saved.id);
            const rows = await listAddresses(user.id);
            setSavedAddresses(rows);
            setAddressFormOpen(false);
            setEditingAddress(false);
          } catch {
            /* non-blocking — still continue checkout */
          }
        }
        setStep(4);
      } finally {
        addressSaveLockRef.current = false;
      }
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
    if (target > step) return;
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
      const attemptKey = getOrCreateCheckoutAttemptKey(cartFingerprint);
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
        idempotencyKey: attemptKey,
        accessToken: session?.access_token,
      });

      if (created?.code === "new_attempt_required") {
        rotateCheckoutAttemptKey(cartFingerprint);
        toast.error(created.error || "This payment attempt has ended. Please try again.");
        unlock();
        return;
      }

      if (created?.paymentStatus === "paid" && created.orderHeaderId && created.orderNumber && created.accessToken) {
        trackPurchaseFromCreateResponse(created);
        toast.success("Payment received");
        clearCart();
        clearCheckoutAttemptKey();
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        navigate(
          `/order-success?order=${encodeURIComponent(created.orderNumber)}&token=${encodeURIComponent(created.accessToken)}`,
          { replace: true },
        );
        return;
      }

      if (!created?.success || !created.order || !created.orderHeaderId || !created.accessToken) {
        const raw = created?.error || "We couldn't start the payment. Please try again.";
        const msg = /server env missing for payments/i.test(raw)
          ? "Online payments are temporarily unavailable. Your cart is safe — please try again later or contact support."
          : raw;
        toast.error(msg);
        unlock();
        return;
      }

      if (!created.keyId) {
        toast.error(
          "Payment gateway is not configured. Your cart is safe — please try again later or contact support.",
        );
        if (created.orderHeaderId && created.accessToken) {
          await markOrderFailed(created.orderHeaderId, created.accessToken, "missing razorpay keyId");
          rotateCheckoutAttemptKey(cartFingerprint);
        }
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
      if (couponCode.trim() && created.totals && !created.totals.couponCode) {
        toast.message("Coupon code wasn't applied to this order.");
      } else if (
        couponCode.trim() &&
        created.totals?.couponCode &&
        Number(created.totals.discountTotal || 0) > 0
      ) {
        toast.success(
          `Coupon ${created.totals.couponCode} applied: −${formatINR(Number(created.totals.discountTotal || 0))}`,
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
            rotateCheckoutAttemptKey(cartFingerprint);
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
          const successPath = (created.orderNumber || "") && created.accessToken
            ? `/order-success?order=${encodeURIComponent(created.orderNumber || "")}&token=${encodeURIComponent(created.accessToken)}`
            : "/order-success";

          try {
            const verified = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderHeaderId: created.orderHeaderId!,
              accessToken: created.accessToken!,
            });

            const code = String(verified?.code || "");
            const invalidSignature = code === "invalid_signature" || /invalid payment signature/i.test(String(verified?.error || ""));

            if (!verified?.success) {
              // Only hard-fail on definitive signature rejection. Network/capture races go to receipt reconciliation.
              if (invalidSignature && orderHeaderId && accessToken) {
                toast.error("Payment could not be verified. Your cart is safe — please try again.");
                await markOrderFailed(orderHeaderId, accessToken, "invalid signature");
                rotateCheckoutAttemptKey(cartFingerprint);
                setPaymentPhase("idle");
                setSubmitting(false);
                submitLockRef.current = false;
                return;
              }

              toast.message("Confirming your payment…");
              clearCart();
              clearCheckoutAttemptKey();
              localStorage.removeItem(CHECKOUT_STORAGE_KEY);
              navigate(successPath, { replace: true });
              return;
            }

            if (verified.paymentStatus === "paid") {
              trackPurchaseAfterVerify({
                paymentStatus: verified.paymentStatus,
                orderNumber: verified.orderNumber || created.orderNumber,
                amount: verified.amount,
                created,
              });
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
              toast.success("Payment received");
            } else {
              toast.message("Confirming your payment…");
            }

            clearCart();
            clearCheckoutAttemptKey();
            localStorage.removeItem(CHECKOUT_STORAGE_KEY);
            navigate(successPath, { replace: true });
          } catch {
            // Payment may already be captured — do not mark failed; reconcile on receipt page / webhook.
            toast.message("Confirming your payment…");
            clearCart();
            clearCheckoutAttemptKey();
            localStorage.removeItem(CHECKOUT_STORAGE_KEY);
            navigate(successPath, { replace: true });
          }
        },
      });

      rzp.on("payment.failed", async (resp: { error?: { description?: string } }) => {
        toast.error(resp?.error?.description || "Payment wasn't completed. You can try again.");
        if (orderHeaderId && accessToken) {
          await markOrderFailed(orderHeaderId, accessToken, resp?.error?.description || "payment.failed");
        }
        rotateCheckoutAttemptKey(cartFingerprint);
        setPaymentPhase("idle");
        setSubmitting(false);
        submitLockRef.current = false;
      });

      rzp.open();
      // Keep submitting=true while Razorpay modal is open (released on dismiss/fail/success)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't start the payment. Please try again.");
      // Do not mark failed on pre-Razorpay exceptions unless an order was created without a key.
      setPaymentPhase("idle");
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const stepMotion = {
    initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
    transition: { duration: reduceMotion ? 0.15 : 0.32, ease: [0.22, 1, 0.36, 1] as const },
  };

  const stickyCtaLabel =
    step === 6
      ? submitting
        ? paymentPhase === "creating"
          ? "Creating order…"
          : paymentPhase === "opening"
            ? "Opening payment…"
            : paymentPhase === "processing"
              ? "Processing…"
              : paymentPhase === "verifying"
                ? "Verifying…"
                : "Please wait…"
        : `Place order · ${formatINR(checkoutTotals.orderTotal)}`
      : step === 5
        ? "Review order"
        : step === 4
          ? "Continue to payment"
          : step === 3
            ? "Continue to delivery"
            : step === 2
              ? "Continue to address"
              : "Continue";

  const onStickyPrimary = () => {
    if (step === 6) void placeOrder();
    else void goNext();
  };

  const errorLiveMessage = Object.values(errors).filter(Boolean).join(" ");

  if (items.length === 0) {
    return (
      <>
        <SEO
          title="Checkout"
          description="Secure AKM Care checkout."
          canonical="/checkout"
          robots="noindex, follow"
        />
        <section className="section-padding bg-[#FAF8F5]">
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

  const OrderSummaryBody = (
    <>
      <div className="flex justify-between text-sm text-[#1A1A1A]">
        <span>Subtotal</span>
        <span>{formatINR(checkoutTotals.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-[#6B6B6B]">
        <span>GST (included)</span>
        <span>{formatINR(checkoutTotals.gstTotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-[#1A1A1A]">
        <span>Delivery</span>
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
          <span>{couponCode.trim().toUpperCase()}</span>
        </div>
      )}
      {checkoutTotals.couponDiscount > 0 && (
        <div className="flex justify-between text-sm text-emerald-700">
          <span>Discount</span>
          <span>−{formatINR(checkoutTotals.couponDiscount)}</span>
        </div>
      )}
      <p className="text-[11px] text-[#6B6B6B] pt-1 leading-relaxed">
        Final total is confirmed at payment. Free delivery above {formatINR(shippingConfig.freeAbove)}.
      </p>
      <div className="flex justify-between font-semibold text-lg border-t border-black/[0.06] pt-3 mt-1">
        <span className="text-[#1A1A1A]">Total</span>
        <span className="text-[#E8621A]">{formatINR(checkoutTotals.orderTotal)}</span>
      </div>
    </>
  );

  return (
    <>
      <SEO
        title="Checkout"
        description="Secure AKM Care checkout with Razorpay."
        canonical="/checkout"
        robots="noindex, follow"
      />
      <section className="bg-[#FAF8F5] pt-6 pb-28 md:pb-16 min-h-[70vh]">
        <div className="container-premium">
          <ShopBreadcrumbs items={crumbs} className="mb-5" />
          <h1 className="font-heading text-3xl sm:text-4xl text-[#1A1A1A] mb-5">Checkout</h1>

          <nav className="mb-8 overflow-x-auto" aria-label="Checkout progress">
            <ol className="flex items-center gap-1 sm:gap-2 min-w-max text-xs sm:text-sm">
              {STEPS.map((label, i) => {
                const n = (i + 1) as StepIndex;
                const active = step === n;
                const done = step > n;
                return (
                  <li key={label} className="flex items-center gap-1 sm:gap-2">
                    {i > 0 && <span className="text-[#6B6B6B]/40 px-0.5" aria-hidden>·</span>}
                    <button
                      type="button"
                      onClick={() => jumpTo(n)}
                      disabled={!done && !active}
                      className={cn(
                        "inline-flex items-center gap-1 font-medium transition-colors",
                        active && "text-[#E8621A]",
                        done && "text-[#1A1A1A] hover:text-[#E8621A]",
                        !done && !active && "text-[#6B6B6B]/60 cursor-default",
                      )}
                      aria-current={active ? "step" : undefined}
                    >
                      {done ? (
                        <>
                          <span>{label}</span>
                          <Check size={14} className="text-emerald-600 shrink-0" aria-hidden />
                        </>
                      ) : (
                        <span>{label}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div aria-live="polite" className="sr-only">
            {errorLiveMessage}
          </div>

          {/* Mobile collapsible summary */}
          <div className="lg:hidden mb-5 rounded-xl border border-black/[0.06] bg-white overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#1A1A1A]"
              onClick={() => setSummaryOpen((o) => !o)}
              aria-expanded={summaryOpen}
            >
              <span>Order summary · {formatINR(checkoutTotals.orderTotal)}</span>
              <ChevronDown
                size={16}
                className={cn("transition-transform text-[#6B6B6B]", summaryOpen && "rotate-180")}
              />
            </button>
            {summaryOpen && <div className="px-4 pb-4 space-y-2 border-t border-black/[0.04] pt-3">{OrderSummaryBody}</div>}
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step-1" {...stepMotion} className="space-y-3">
                    <h2 className="font-heading text-xl text-[#1A1A1A]">Your cart</h2>
                    {items.map((line) => (
                      <div
                        key={`${line.productId}-${line.colorId}-${line.variantId}`}
                        className="flex gap-3 items-start border-b border-black/[0.05] pb-3 last:border-0"
                      >
                        <Link
                          to={productPath(line.slug)}
                          className="h-16 w-14 overflow-hidden bg-white shrink-0 border border-black/[0.06] rounded-md group"
                        >
                          <img
                            src={line.image || "/placeholder.svg"}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#1A1A1A] line-clamp-2">{line.name}</p>
                          <p className="text-xs text-[#6B6B6B] mt-0.5">
                            {line.colorName || line.variantName
                              ? [line.colorName, line.variantName].filter(Boolean).join(" · ")
                              : line.sku}
                          </p>
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <div className="inline-flex items-center gap-1 rounded-full border border-black/10 px-1 py-0.5 bg-white">
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
                              className="text-xs font-semibold text-[#6B6B6B] hover:text-red-600 inline-flex items-center gap-1"
                              onClick={() => removeFromCart(line.productId, line.colorId, line.variantId)}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                        <span className="font-semibold text-sm shrink-0 text-[#1A1A1A]">
                          {formatINR(line.unitPrice * line.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        to="/shop"
                        className="rounded-full border border-black/10 bg-white px-5 py-2.5 font-semibold text-sm text-[#1A1A1A]"
                      >
                        Continue shopping
                      </Link>
                      <button
                        type="button"
                        onClick={() => void goNext()}
                        className="hidden md:inline-flex rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step-2" {...stepMotion} className="space-y-4">
                    <div>
                      <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A]">
                        Let&apos;s get your order to you.
                      </h2>
                      <p className="text-sm text-[#6B6B6B] mt-1">
                        We&apos;ll use these details for updates and delivery.
                      </p>
                    </div>
                    <div className="space-y-3 max-w-lg">
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
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step-3" {...stepMotion} className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A]">
                          Where should we deliver?
                        </h2>
                      </div>
                      {!isAuthenticated && (
                        <Link
                          to="/auth"
                          state={{ from: "/checkout" }}
                          className="text-xs font-semibold text-[#E8621A] shrink-0 mt-1"
                        >
                          Sign in for saved addresses
                        </Link>
                      )}
                    </div>

                    {savedAddresses.length > 0 && (
                      <div className="space-y-2">
                        {savedAddresses.map((a) => {
                          const selected = selectedSavedId === a.id;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => applyAddress(a)}
                              className={cn(
                                "w-full text-left rounded-xl border p-3.5 text-sm transition-colors relative",
                                selected
                                  ? "border-[#E8621A] bg-[#FFF7F2]"
                                  : "border-black/[0.08] bg-white hover:border-[#E8621A]/40",
                              )}
                            >
                              {selected && (
                                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8621A] text-white">
                                  <Check size={12} strokeWidth={3} aria-hidden />
                                </span>
                              )}
                              <span className="uppercase text-[10px] font-bold tracking-wide text-[#E8621A]">
                                {a.label}
                              </span>
                              <p className="font-semibold text-[#1A1A1A] pr-8">{a.full_name}</p>
                              <p className="text-[#6B6B6B] mt-0.5">
                                {a.area}
                                {a.landmark ? `, ${a.landmark}` : ""}
                                <br />
                                {a.city}, {a.state} — {a.pincode}
                              </p>
                              {selected && (
                                <button
                                  type="button"
                                  className="mt-2 text-xs font-semibold text-[#E8621A] inline-flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAddress(true);
                                    setAddressFormOpen(true);
                                  }}
                                >
                                  <Pencil size={11} /> Edit
                                </button>
                              )}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={addNewAddress}
                          className="w-full text-left rounded-xl border border-dashed border-black/15 px-3.5 py-3 text-sm font-semibold text-[#1A1A1A] hover:border-[#E8621A]/50 hover:text-[#E8621A] transition-colors"
                        >
                          + Add a new address
                        </button>
                      </div>
                    )}

                    {showAddressForm && (
                      <div className="grid sm:grid-cols-2 gap-3 rounded-xl border border-black/[0.06] bg-white p-4">
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
                            label="Landmark / Address line 2"
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
                          <span className="font-medium text-[#1A1A1A]">
                            State <span className="text-[#E8621A]">*</span>
                          </span>
                          <select
                            className={cn(
                              "mt-1 w-full rounded-lg border px-3 py-2.5 bg-white text-[#1A1A1A]",
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
                          {fieldError("state") && (
                            <p className="mt-1 text-xs text-red-600">{fieldError("state")}</p>
                          )}
                        </label>
                        <div className="sm:col-span-2 space-y-2">
                          <Field
                            label="Pincode"
                            required
                            error={fieldError("pincode")}
                            value={draft.address.pincode}
                            onBlur={() => blurField("pincode", validateAddressFields())}
                            onChange={(v) => updateAddress("pincode", v.replace(/\D/g, "").slice(0, 6))}
                            autoComplete="postal-code"
                          />
                          <CheckoutPincodeVerify pincode={draft.address.pincode} />
                        </div>
                        <fieldset className="sm:col-span-2">
                          <legend className="text-sm font-medium mb-2 text-[#1A1A1A]">Address type</legend>
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
                                    : "bg-white border-black/10 text-[#1A1A1A]",
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        {isAuthenticated && (
                          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-[#1A1A1A]">
                            <input
                              type="checkbox"
                              checked={saveAddressForLater}
                              onChange={(e) => setSaveAddressForLater(e.target.checked)}
                            />
                            Save this address to my account
                          </label>
                        )}
                      </div>
                    )}

                    <NavButtons onBack={goBack} onNext={() => void goNext()} nextLabel="Continue to delivery" />
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="step-4" {...stepMotion} className="space-y-4">
                    <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A]">Delivery</h2>
                    <p className="text-sm text-[#6B6B6B]">Choose how quickly you&apos;d like your order.</p>
                    {(
                      [
                        {
                          id: "standard" as const,
                          label: "Standard Delivery",
                          detail: "3–5 business days",
                          eta: shippingWindowLabel(3, 5),
                          price: shippingConfig.standard,
                        },
                        {
                          id: "express" as const,
                          label: "Express Delivery",
                          detail: "1–2 business days",
                          eta: shippingWindowLabel(1, 2),
                          price: shippingConfig.express,
                        },
                      ]
                    ).map((opt) => {
                      const selected = shippingMethod === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setShippingMethod(opt.id);
                            setDraft((d) => ({ ...d, shippingMethod: opt.id }));
                          }}
                          className={cn(
                            "w-full flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors",
                            selected
                              ? "border-[#E8621A] bg-[#FFF7F2]"
                              : "border-black/[0.08] bg-white hover:border-[#E8621A]/35",
                          )}
                        >
                          <span className="flex items-start gap-3">
                            <span
                              className={cn(
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                selected
                                  ? "border-[#E8621A] bg-[#E8621A] text-white"
                                  : "border-black/20 bg-white",
                              )}
                              aria-hidden
                            >
                              {selected && <Check size={12} strokeWidth={3} />}
                            </span>
                            <span>
                              <span className="font-semibold block text-[#1A1A1A]">{opt.label}</span>
                              <span className="text-xs text-[#6B6B6B] block">{opt.detail}</span>
                              <span className="text-xs text-[#6B6B6B] block mt-0.5">Est. {opt.eta}</span>
                            </span>
                          </span>
                          <span className="font-semibold shrink-0 text-[#1A1A1A]">{formatINR(opt.price)}</span>
                        </button>
                      );
                    })}
                    <NavButtons onBack={goBack} onNext={() => void goNext()} nextLabel="Continue to payment" />
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="step-5" {...stepMotion} className="space-y-4">
                    <div>
                      <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A]">
                        Choose how you&apos;d like to pay.
                      </h2>
                      <p className="text-sm text-[#6B6B6B] mt-1">
                        Razorpay supports UPI, Cards, Net Banking, and Wallets.
                      </p>
                    </div>
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
                    ).map((m) => {
                      const selected = draft.paymentMethod === m.id;
                      return (
                        <label
                          key={m.id}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-4",
                            m.enabled && selected
                              ? "border-[#E8621A] bg-[#FFF7F2]"
                              : "border-black/[0.08] bg-white",
                            !m.enabled && "opacity-55 cursor-not-allowed",
                          )}
                        >
                          <input
                            type="radio"
                            name="pay"
                            className="mt-1 sr-only"
                            disabled={!m.enabled}
                            checked={selected}
                            onChange={() => setDraft((d) => ({ ...d, paymentMethod: m.id }))}
                          />
                          <span
                            className={cn(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              m.enabled && selected
                                ? "border-[#E8621A] bg-[#E8621A] text-white"
                                : "border-black/20",
                            )}
                            aria-hidden
                          >
                            {m.enabled && selected && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span>
                            <span className="font-semibold block text-[#1A1A1A]">{m.label}</span>
                            <span className="text-xs text-[#6B6B6B]">{m.hint}</span>
                          </span>
                        </label>
                      );
                    })}

                    <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#1A1A1A]"
                        onClick={() => setCouponOpen((o) => !o)}
                        aria-expanded={couponOpen}
                      >
                        Have a coupon?
                        <ChevronDown
                          size={16}
                          className={cn("text-[#6B6B6B] transition-transform", couponOpen && "rotate-180")}
                        />
                      </button>
                      {couponOpen && (
                        <div className="px-4 pb-4 space-y-2 border-t border-black/[0.04] pt-3">
                          <input
                            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
                            placeholder="Enter code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          />
                          {couponCode.trim() ? (
                            <p
                              className={cn(
                                "text-xs",
                                couponLoading
                                  ? "text-[#6B6B6B]"
                                  : couponPreview?.valid
                                    ? "text-emerald-700"
                                    : "text-red-600",
                              )}
                            >
                              {couponLoading
                                ? "Checking coupon…"
                                : couponPreview?.message || "Coupon will be verified on the server."}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <NavButtons onBack={goBack} onNext={() => void goNext()} nextLabel="Review order" />
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div key="step-6" {...stepMotion} className="space-y-5">
                    <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A]">Review your order</h2>

                    <ReviewBlock title="Your items" onEdit={() => jumpTo(1)}>
                      <ul className="space-y-2 text-sm">
                        {items.map((line) => (
                          <li
                            key={`${line.productId}-${line.colorId}-${line.variantId}`}
                            className="flex justify-between gap-3"
                          >
                            <span className="text-[#1A1A1A]">
                              {line.name} × {line.quantity}
                            </span>
                            <span className="font-semibold">{formatINR(line.unitPrice * line.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </ReviewBlock>

                    <ReviewBlock title="Customer" onEdit={() => jumpTo(2)}>
                      <p className="text-sm text-[#1A1A1A]">
                        {draft.customer.name}
                        <br />
                        {draft.customer.email}
                        <br />
                        {draft.customer.phone}
                      </p>
                    </ReviewBlock>

                    <ReviewBlock title="Delivery address" onEdit={() => jumpTo(3)}>
                      <p className="text-sm capitalize text-[#E8621A] font-semibold mb-1">{addressLabel}</p>
                      <p className="text-sm text-[#6B6B6B]">
                        {draft.address.line1}
                        {draft.address.line2 ? `, ${draft.address.line2}` : ""}
                        <br />
                        {draft.address.city}, {draft.address.state} — {draft.address.pincode}
                      </p>
                    </ReviewBlock>

                    <ReviewBlock title="Delivery" onEdit={() => jumpTo(4)}>
                      <p className="text-sm text-[#1A1A1A]">
                        {shippingMethod === "express" ? "Express Delivery" : "Standard Delivery"} ·{" "}
                        {formatINR(shippingTotal)}
                        <br />
                        <span className="text-[#6B6B6B]">
                          Est. {shippingMethod === "express" ? shippingWindowLabel(1, 2) : shippingWindowLabel(3, 5)}
                        </span>
                      </p>
                    </ReviewBlock>

                    <ReviewBlock title="Payment & totals" onEdit={() => jumpTo(5)}>
                      <div className="text-sm space-y-1 text-[#1A1A1A]">
                        <p className="capitalize">Method: {draft.paymentMethod}</p>
                        <p>Subtotal: {formatINR(checkoutTotals.subtotal)}</p>
                        <p>GST (included): {formatINR(checkoutTotals.gstTotal)}</p>
                        <p>Delivery: {formatINR(shippingTotal)}</p>
                        {checkoutTotals.couponDiscount > 0 && (
                          <p className="text-emerald-700">
                            Estimated discount: −{formatINR(checkoutTotals.couponDiscount)}
                          </p>
                        )}
                        {couponCode && <p>Coupon: {couponCode}</p>}
                        <p className="font-semibold text-[#E8621A] pt-1">
                          Grand total: {formatINR(checkoutTotals.orderTotal)}
                        </p>
                      </div>
                    </ReviewBlock>

                    <label className="block text-sm">
                      <span className="font-medium text-[#1A1A1A]">Order notes (optional)</span>
                      <textarea
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm bg-white"
                        rows={3}
                        placeholder="Delivery instructions, gift note…"
                        value={draft.notes}
                        onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                      />
                    </label>

                    <div className="hidden md:flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={goBack}
                        className="rounded-full border border-black/10 px-5 py-2.5 font-semibold bg-white text-[#1A1A1A]"
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <aside className="hidden lg:block rounded-xl border border-black/[0.06] p-5 h-fit bg-white space-y-2 sticky top-24">
              <h2 className="font-heading text-lg mb-3 text-[#1A1A1A]">Order summary</h2>
              {OrderSummaryBody}
            </aside>
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-black/[0.06] bg-[#FAF8F5]/95 backdrop-blur-sm px-4 py-3 safe-area-pb">
          <div className="container-premium flex items-center gap-2 max-w-lg mx-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-full border border-black/10 bg-white px-4 py-3 font-semibold text-sm text-[#1A1A1A] shrink-0"
              >
                Back
              </button>
            )}
            <button
              type="button"
              disabled={step === 6 && submitting}
              onClick={onStickyPrimary}
              className="flex-1 rounded-full bg-[#E8621A] text-white font-semibold px-5 py-3 text-sm disabled:opacity-60 min-h-12"
            >
              {stickyCtaLabel}
            </button>
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
      <span className="font-medium text-[#1A1A1A]">
        {label}
        {required ? <span className="text-[#E8621A]"> *</span> : null}
      </span>
      <input
        id={inputId}
        type={type}
        className={cn(
          "mt-1 w-full rounded-lg border px-3 py-2.5 bg-white text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35",
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
    <div className="hidden md:flex flex-wrap gap-2 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="rounded-full border border-black/10 px-5 py-2.5 font-semibold bg-white text-[#1A1A1A]"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5"
      >
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
    <div className="rounded-xl border border-black/[0.06] p-4 bg-white">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-[#1A1A1A]">{title}</h3>
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
