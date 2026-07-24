import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GitCompare, X } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { getProductById } from "@/services/productService";
import { allCatalogProducts } from "@/data/catalog/products";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";

export function CompareTray() {
  const { ids, count, remove, clear } = useCompare();
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (ids.length === 0) {
        setProducts([]);
        return;
      }
      const resolved: CatalogProduct[] = [];
      for (const id of ids.slice(0, 4)) {
        try {
          const remote = await getProductById(id);
          if (remote) {
            resolved.push(remote);
            continue;
          }
        } catch {
          /* fall through */
        }
        const local = allCatalogProducts.find((p) => p.id === id);
        if (local) resolved.push(local);
      }
      if (!cancelled) setProducts(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (count === 0) return null;

  return (
    <div className="fixed z-[85] inset-x-0 bottom-0 lg:bottom-0 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto max-w-5xl m-3 rounded-2xl border border-black/10 bg-white shadow-2xl p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="font-heading text-sm sm:text-base inline-flex items-center gap-2">
            <GitCompare size={16} className="text-[#E8621A]" /> Compare ({count}/4)
          </p>
          <button type="button" onClick={clear} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#E8621A]">
            Clear all
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {products.map((p) => (
            <div key={p.id} className="relative rounded-xl border border-black/[0.06] p-2 bg-[#FAF8F5]">
              <button
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() => remove(p.id)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white border border-black/10 flex items-center justify-center"
              >
                <X size={12} />
              </button>
              <Link to={productPath(p.slug)} className="block">
                <img
                  src={p.images[0]?.src || "/placeholder.svg"}
                  alt=""
                  className="h-16 w-full object-cover rounded-lg mb-1.5"
                  loading="lazy"
                />
                <p className="text-[11px] font-medium line-clamp-2">{p.name}</p>
                <p className="text-xs font-semibold text-[#E8621A] mt-0.5">{formatINR(getEffectivePrice(p))}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
