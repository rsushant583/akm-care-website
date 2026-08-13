import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, Heart, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { shopCategoryPath } from "@/data/catalog/categories";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", path: "/", icon: Home, match: (p: string) => p === "/" },
  {
    label: "Categories",
    path: shopCategoryPath("sarees"),
    icon: LayoutGrid,
    match: (p: string, s: string) => p === "/shop" && s.includes("category="),
  },
  {
    label: "Shop",
    path: "/shop",
    icon: ShoppingBag,
    match: (p: string, s: string) => p === "/shop" && !s.includes("category="),
  },
  { label: "Wishlist", path: "/wishlist", icon: Heart, match: (p: string) => p === "/wishlist" },
  { label: "Account", path: "/account", icon: User, match: (p: string) => p === "/account" || p === "/auth" },
];

export default function MobileNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { count: wishlistCount } = useWishlist();

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-black/[0.06] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-16 items-stretch px-1">
        {items.map((item) => {
          const path = item.label === "Account" && !isAuthenticated ? "/auth" : item.path;
          const isActive = item.match(location.pathname, location.search);
          return (
            <Link
              key={item.label}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-h-[48px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8621A]/40",
              )}
            >
              <span className="relative">
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={isActive ? "text-[#E8621A]" : "text-[#6B6B6B]"}
                  aria-hidden
                />
                {item.label === "Wishlist" && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[0.95rem] h-[0.95rem] px-0.5 rounded-full bg-[#E8621A] text-white text-[9px] font-bold flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-[#E8621A]" : "text-[#6B6B6B]",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
