/**
 * Rewrite CartContext with auth-aware persistence + guest merge.
 * Public API (addToCart, etc.) stays compatible with existing shop UI.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartLineItem, CatalogProduct, SavedForLaterItem } from "@/lib/ecommerce/types";
import { calcCartTotals, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import {
  loadCartFromDatabase,
  mergeCartLines,
  syncCartToDatabase,
} from "@/services/cartService";

const CART_KEY = "akm_shop_cart_v1";
const SAVED_KEY = "akm_shop_saved_v1";
const SESSION_KEY = "akm_cart_session_id";

type AddPayload = {
  product: CatalogProduct;
  quantity?: number;
  colorId?: string;
  colorName?: string;
  variantId?: string;
  variantName?: string;
};

type CartContextValue = {
  items: CartLineItem[];
  savedForLater: SavedForLaterItem[];
  itemCount: number;
  totals: ReturnType<typeof calcCartTotals>;
  checkoutTotals: ReturnType<typeof calcCartTotals>;
  couponCode: string;
  setCouponCode: (code: string) => void;
  shippingMethod: "standard" | "express";
  setShippingMethod: (m: "standard" | "express") => void;
  shippingTotal: number;
  addToCart: (payload: AddPayload) => void;
  updateQuantity: (productId: string, quantity: number, colorId?: string, variantId?: string) => void;
  removeFromCart: (productId: string, colorId?: string, variantId?: string) => void;
  clearCart: () => void;
  saveForLater: (productId: string, colorId?: string, variantId?: string) => void;
  moveToCart: (productId: string, colorId?: string, variantId?: string) => void;
  removeSaved: (productId: string, colorId?: string, variantId?: string) => void;
  buyNowLine: (payload: AddPayload) => CartLineItem[];
  sessionId: string;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, colorId?: string, variantId?: string) {
  return `${productId}::${colorId ?? ""}::${variantId ?? ""}`;
}

function matchesLine(line: CartLineItem, productId: string, colorId?: string, variantId?: string) {
  return lineKey(line.productId, line.colorId, line.variantId) === lineKey(productId, colorId, variantId);
}

function toLine(payload: AddPayload): CartLineItem {
  const { product, quantity = 1, colorId, colorName, variantId, variantName } = payload;
  const max = Math.max(1, product.stock_quantity || 10);
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.image_url || product.images[0]?.src || "",
    sku: product.sku,
    unitPrice: getEffectivePrice(product),
    mrp: product.mrp,
    gstPercent: product.gstPercent,
    quantity: Math.max(1, Math.min(max, quantity)),
    colorId,
    colorName,
    variantId,
    variantName,
    maxQuantity: max,
  };
}

function readSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return "guest-session";
  }
}

const SHIPPING_RATES = { standard: 49, express: 99 } as const;

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<SavedForLaterItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [sessionId] = useState(readSessionId);
  const [hydrated, setHydrated] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  useEffect(() => {
    try {
      const cartRaw = localStorage.getItem(CART_KEY);
      const savedRaw = localStorage.getItem(SAVED_KEY);
      if (cartRaw) {
        const parsed = JSON.parse(cartRaw) as CartLineItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as SavedForLaterItem[];
        if (Array.isArray(parsed)) setSavedForLater(parsed);
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, []);

  // Merge guest cart after login
  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user) return;
    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;

    void (async () => {
      try {
        const remote = await loadCartFromDatabase({ sessionId, userId: user.id });
        setItems((local) => mergeCartLines(local, remote.items));
        setSavedForLater((local) => mergeCartLines(local, remote.savedForLater));
      } catch {
        /* keep local */
      }
    })();
  }, [hydrated, isAuthenticated, user, sessionId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedForLater));
    } catch {
      /* ignore */
    }
  }, [savedForLater, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      void syncCartToDatabase({
        sessionId,
        userId: user?.id,
        items,
        savedForLater,
      }).catch(() => undefined);
    }, 400);
    return () => window.clearTimeout(t);
  }, [items, savedForLater, sessionId, user?.id, hydrated]);

  const addToCart = useCallback((payload: AddPayload) => {
    if (payload.product.stock_quantity <= 0) {
      toast.error("This product is currently out of stock.");
      return;
    }
    setItems((prev) => {
      const idx = prev.findIndex((l) =>
        matchesLine(l, payload.product.id, payload.colorId, payload.variantId),
      );
      if (idx === -1) return [...prev, toLine(payload)];
      const next = [...prev];
      const max = next[idx].maxQuantity;
      next[idx] = {
        ...next[idx],
        quantity: Math.min(max, next[idx].quantity + (payload.quantity ?? 1)),
      };
      return next;
    });
    toast.success("Added to cart");
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, colorId?: string, variantId?: string) => {
      setItems((prev) =>
        prev
          .map((line) => {
            if (!matchesLine(line, productId, colorId, variantId)) return line;
            return {
              ...line,
              quantity: Math.max(1, Math.min(line.maxQuantity, quantity)),
            };
          })
          .filter((line) => line.quantity > 0),
      );
    },
    [],
  );

  const removeFromCart = useCallback((productId: string, colorId?: string, variantId?: string) => {
    setItems((prev) => prev.filter((l) => !matchesLine(l, productId, colorId, variantId)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const saveForLater = useCallback((productId: string, colorId?: string, variantId?: string) => {
    setItems((prev) => {
      const line = prev.find((l) => matchesLine(l, productId, colorId, variantId));
      if (!line) return prev;
      setSavedForLater((saved) => {
        const exists = saved.some((s) => matchesLine(s, productId, colorId, variantId));
        return exists ? saved : [...saved, line];
      });
      return prev.filter((l) => !matchesLine(l, productId, colorId, variantId));
    });
    toast.success("Saved for later");
  }, []);

  const moveToCart = useCallback((productId: string, colorId?: string, variantId?: string) => {
    setSavedForLater((prev) => {
      const line = prev.find((l) => matchesLine(l, productId, colorId, variantId));
      if (!line) return prev;
      setItems((cart) => {
        const exists = cart.some((c) => matchesLine(c, productId, colorId, variantId));
        return exists ? cart : [...cart, line];
      });
      return prev.filter((l) => !matchesLine(l, productId, colorId, variantId));
    });
    toast.success("Moved to cart");
  }, []);

  const removeSaved = useCallback((productId: string, colorId?: string, variantId?: string) => {
    setSavedForLater((prev) => prev.filter((l) => !matchesLine(l, productId, colorId, variantId)));
  }, []);

  const buyNowLine = useCallback((payload: AddPayload) => {
    const line = toLine(payload);
    setItems([line]);
    return [line];
  }, []);

  const shippingTotal = items.length === 0 ? 0 : SHIPPING_RATES[shippingMethod];

  const totals = useMemo(
    () =>
      calcCartTotals(items, {
        // Shipping is chosen at checkout — keep cart/nav totals product-only
        shippingEstimate: null,
        couponDiscount:
          couponCode.trim().toUpperCase() === "AKMCARE10"
            ? Math.round(items.reduce((n, l) => n + l.unitPrice * l.quantity, 0) * 0.1)
            : 0,
      }),
    [items, couponCode],
  );

  const checkoutTotals = useMemo(
    () =>
      calcCartTotals(items, {
        shippingEstimate: shippingTotal,
        couponDiscount: totals.couponDiscount,
      }),
    [items, shippingTotal, totals.couponDiscount],
  );

  const value: CartContextValue = {
    items,
    savedForLater,
    itemCount: totals.itemCount,
    totals,
    checkoutTotals,
    couponCode,
    setCouponCode,
    shippingMethod,
    setShippingMethod,
    shippingTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    saveForLater,
    moveToCart,
    removeSaved,
    buyNowLine,
    sessionId,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
