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
}: {
  visible: boolean;
  price: number;
  inStock: boolean;
  onAdd: () => void;
  onBuy: () => void;
  productName: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[80] transition-transform duration-300 lg:hidden",
        "pb-[env(safe-area-inset-bottom,0px)]",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-2 mb-2 rounded-2xl border border-black/10 bg-white/95 backdrop-blur-md shadow-2xl p-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-[#6B6B6B] line-clamp-1">{productName}</p>
          <p className="font-semibold text-[#E8621A]">{formatINR(price)}</p>
        </div>
        <button
          type="button"
          disabled={!inStock}
          onClick={onAdd}
          className="h-11 w-11 rounded-full border border-[#E8621A]/30 text-[#E8621A] flex items-center justify-center disabled:opacity-50"
          aria-label="Add to cart"
        >
          <ShoppingCart size={18} />
        </button>
        <button
          type="button"
          disabled={!inStock}
          onClick={onBuy}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-[#E8621A] text-white text-sm font-semibold disabled:opacity-50"
        >
          <Zap size={16} /> Buy Now
        </button>
      </div>
    </div>
  );
}
