import { Link, useLocation } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/ecommerce/pricing";
import { cn } from "@/lib/utils";

/** Floating cart affordance for shop browsing — does not alter cart logic. */
export function FloatingCart() {
  const { itemCount, totals } = useCart();
  const location = useLocation();

  const onListing = location.pathname === "/shop";
  if (!onListing || itemCount === 0) return null;

  return (
    <Link
      to="/cart"
      className={cn(
        "fixed z-[90] right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-6",
        "inline-flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full",
        "bg-[#1A1A1A] text-white shadow-xl shadow-black/20 hover:brightness-110 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
      )}
      aria-label={`Open cart, ${itemCount} items`}
    >
      <span className="relative h-9 w-9 rounded-full bg-[#E8621A] flex items-center justify-center">
        <ShoppingBag size={16} />
        <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-white text-[#E8621A] text-[10px] font-bold flex items-center justify-center">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      </span>
      <span className="text-sm font-semibold">{formatINR(totals.orderTotal)}</span>
    </Link>
  );
}
