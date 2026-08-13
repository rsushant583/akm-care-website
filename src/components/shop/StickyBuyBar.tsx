import { ShoppingCart, Zap } from "lucide-react";
import { formatINR } from "@/lib/ecommerce/pricing";
import { cn } from "@/lib/utils";

export function StickyBuyBar({
  visible,
  price,
  inStock,
  onAdd,
  onBuy,
  productName,
  adding = false,
}: {
  visible: boolean;
  price: number;
  inStock: boolean;
  onAdd: () => void;
  onBuy: () => void;
  productName: string;
  adding?: boolean;
}) {
  if (!inStock && !visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[80] transition-transform duration-300 lg:hidden",
        "bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]",
        visible && inStock ? "translate-y-0" : "translate-y-full pointer-events-none",
      )}
      aria-hidden={!visible || !inStock}
    >
      <div className="mx-2 mb-1 rounded-2xl border border-black/10 bg-white/95 backdrop-blur-md shadow-xl p-2.5 flex items-center gap-2.5">
        <div className="min-w-0 flex-1 pl-1">
          <p className="text-[11px] text-[#6B6B6B] line-clamp-1">{productName}</p>
          <p className="type-price text-base leading-tight">{formatINR(price)}</p>
        </div>
        <button
          type="button"
          disabled={!inStock || adding}
          onClick={onAdd}
          className="h-11 px-3.5 rounded-full border border-[#E8621A]/35 text-[#E8621A] text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
        >
          <ShoppingCart size={15} aria-hidden />
          {adding ? "Adding…" : "Cart"}
        </button>
        <button
          type="button"
          disabled={!inStock || adding}
          onClick={onBuy}
          className="h-11 px-4 rounded-full bg-[#E8621A] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
        >
          <Zap size={15} aria-hidden /> Buy Now
        </button>
      </div>
    </div>
  );
}
