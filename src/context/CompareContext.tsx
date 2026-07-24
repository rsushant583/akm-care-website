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
import { toast } from "@/components/ui/sonner";

const COMPARE_KEY = "akm_shop_compare_v1";
const MAX_COMPARE = 4;

type CompareContextValue = {
  ids: string[];
  count: number;
  isCompared: (id: string) => boolean;
  toggleCompare: (product: CatalogProduct) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setIds(parsed.slice(0, MAX_COMPARE));
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
      localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids, hydrated]);

  const isCompared = useCallback((id: string) => ids.includes(id), [ids]);

  const toggleCompare = useCallback((product: CatalogProduct) => {
    setIds((prev) => {
      if (prev.includes(product.id)) {
        toast.message(`Removed ${product.name} from compare`);
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= MAX_COMPARE) {
        toast.error(`You can compare up to ${MAX_COMPARE} products`);
        return prev;
      }
      toast.success(`Added ${product.name} to compare`);
      return [...prev, product.id];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, count: ids.length, isCompared, toggleCompare, remove, clear }),
    [ids, isCompared, toggleCompare, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
