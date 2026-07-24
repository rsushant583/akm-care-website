import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogProduct } from "@/lib/ecommerce/types";

const RECENT_KEY = "akm_shop_recently_viewed_v1";
const MAX_RECENT = 12;

type RecentEntry = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp: number;
  discountPercent: number;
  viewedAt: string;
};

type RecentlyViewedContextValue = {
  items: RecentEntry[];
  track: (product: CatalogProduct) => void;
  clear: () => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentEntry[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const track = useCallback((product: CatalogProduct) => {
    setItems((prev) => {
      const entry: RecentEntry = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.src || product.image_url || "",
        price: product.akmCarePrice || product.price,
        mrp: product.mrp,
        discountPercent: product.discountPercent,
        viewedAt: new Date().toISOString(),
      };
      return [entry, ...prev.filter((p) => p.id !== product.id)].slice(0, MAX_RECENT);
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({ items, track, clear }), [items, track, clear]);

  return (
    <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return ctx;
}
