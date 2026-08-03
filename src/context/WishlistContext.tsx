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
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { loadWishlistIds, mergeWishlistIds, syncWishlist } from "@/services/wishlistService";

const WISHLIST_KEY = "akm_shop_wishlist_v1";
const SESSION_KEY = "akm_cart_session_id";

type WishlistContextValue = {
  ids: string[];
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string, productName?: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readSessionId() {
  try {
    return localStorage.getItem(SESSION_KEY) || crypto.randomUUID();
  } catch {
    return "guest-session";
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [sessionId] = useState(readSessionId);
  const mergedForUser = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setIds(parsed);
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user) return;
    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;
    void (async () => {
      try {
        const remote = await loadWishlistIds({ sessionId, userId: user.id });
        setIds((local) => mergeWishlistIds(local, remote));
      } catch {
        /* keep local */
      }
    })();
  }, [hydrated, isAuthenticated, user, sessionId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids, hydrated]);

  useEffect(() => {
    // DB wishlist sync only for authenticated users (guests stay in localStorage — C3)
    if (!hydrated || !user?.id) return;
    const t = window.setTimeout(() => {
      void syncWishlist({
        sessionId,
        userId: user.id,
        productIds: ids,
      }).catch(() => undefined);
    }, 400);
    return () => window.clearTimeout(t);
  }, [ids, hydrated, sessionId, user?.id]);

  const isWishlisted = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggleWishlist = useCallback((productId: string, productName?: string) => {
    setIds((prev) => {
      if (prev.includes(productId)) {
        toast.message(productName ? `Removed ${productName} from wishlist` : "Removed from wishlist");
        return prev.filter((id) => id !== productId);
      }
      toast.success(productName ? `Saved ${productName}` : "Added to wishlist");
      return [...prev, productId];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({
      ids,
      count: ids.length,
      isWishlisted,
      toggleWishlist,
      remove,
      clear,
    }),
    [ids, isWishlisted, toggleWishlist, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
