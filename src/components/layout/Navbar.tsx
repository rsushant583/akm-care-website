import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Heart, Menu, ShoppingCart, User } from "lucide-react";
import logo from "@/assets/akm-logo.jpeg";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { ProductSearch } from "@/components/shop/ProductSearch";
import {
  OFFICIAL_BROWSABLE_CATEGORIES,
  shopCategoryPath,
  shopCollectionPath,
} from "@/data/catalog/categories";
import { cn } from "@/lib/utils";

const companyLinks = [
  { label: "About", path: "/about" },
  { label: "CSR", path: "/csr" },
  { label: "Media", path: "/media" },
  { label: "Motivation", path: "/motivation" },
  { label: "Careers", path: "/careers" },
  { label: "FAQ", path: "/faq" },
  { label: "Contact", path: "/contact" },
  { label: "Training", path: "/training" },
  { label: "Personal Booking", path: "/personal-booking" },
  { label: "Disclaimer", path: "/disclaimer" },
];

const sheetPrimary = [
  { label: "Shop", path: "/shop" },
  { label: "Deals", path: shopCollectionPath("deals") },
  { label: "Services", path: "/services" },
  { label: "Sell With Us", path: "/sell-your-product" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 8);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname, location.search]);

  const linkClass = (active: boolean) =>
    cn(
      "relative shrink px-2 py-2 text-[0.75rem] 2xl:text-[0.8rem] font-medium tracking-wide transition-colors whitespace-nowrap",
      active ? "text-[#1A1A1A]" : "text-[#1A1A1A]/75 hover:text-[#1A1A1A]",
    );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,0px)] border-b transition-colors duration-200",
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-black/[0.06] shadow-sm"
          : "bg-white border-black/[0.04]",
      )}
    >
      <div className="container-premium flex items-center gap-2 sm:gap-3 h-14">
        <Link to="/" className="flex items-center shrink-0" aria-label="AKM Care home">
          <img
            src={logo}
            alt="AKM Care"
            width={120}
            height={40}
            loading="eager"
            decoding="async"
            className="h-8 w-auto object-contain"
          />
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5 shrink-0 ml-1" aria-label="Primary">
          <Link
            to="/shop"
            className={linkClass(location.pathname === "/shop" && !location.search.includes("collection="))}
          >
            Shop
            {location.pathname === "/shop" && !location.search.includes("collection=") ? (
              <span className="absolute left-2 right-2 bottom-1 h-0.5 rounded-full bg-[#E8621A]" />
            ) : null}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(linkClass(false), "inline-flex items-center gap-1 outline-none")}
              aria-label="Shop by category"
            >
              Categories <ChevronDown size={14} aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[15rem]">
              {OFFICIAL_BROWSABLE_CATEGORIES.map((cat) => (
                <DropdownMenuItem key={cat.id} asChild>
                  <Link to={shopCategoryPath(cat.id)}>{cat.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to={shopCollectionPath("deals")} className={linkClass(location.search.includes("collection=deals"))}>
            Deals
          </Link>
          <Link to="/services" className={linkClass(location.pathname === "/services")}>
            Services
          </Link>
          <Link to="/sell-your-product" className={linkClass(location.pathname === "/sell-your-product")}>
            Sell With Us
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(linkClass(false), "inline-flex items-center gap-1 outline-none")}
              aria-label="Company pages"
            >
              Company <ChevronDown size={14} aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[14rem]">
              {companyLinks.map((link) => (
                <DropdownMenuItem key={link.path} asChild>
                  <Link to={link.path}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2 min-w-0">
          <div className="hidden md:block flex-1 max-w-[16rem] lg:max-w-[18rem] xl:max-w-[20rem]">
            <ProductSearch
              navigateToShop
              value=""
              onChange={() => {}}
              placeholder="Search products…"
              className="[&_input]:h-9 [&_input]:py-1.5 [&_input]:text-sm [&_input]:rounded-full"
            />
          </div>
          <div className="flex-1 md:hidden max-w-[min(52vw,14rem)]">
            <ProductSearch
              navigateToShop
              value=""
              onChange={() => {}}
              placeholder="Search…"
              className="[&_input]:h-9 [&_input]:py-1.5 [&_input]:text-sm [&_input]:rounded-full [&_input]:pl-9"
            />
          </div>

          <Link
            to={isAuthenticated ? "/account" : "/auth"}
            aria-label={isAuthenticated ? "My account" : "Sign in"}
            className="btn-icon hidden md:inline-flex"
          >
            <User size={18} aria-hidden />
          </Link>
          <Link
            to="/wishlist"
            aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}
            className="btn-icon relative hidden md:inline-flex"
          >
            <Heart size={18} aria-hidden />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#E8621A] text-white text-[10px] font-bold flex items-center justify-center">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            aria-label={`Shopping cart${itemCount ? `, ${itemCount} items` : ""}`}
            className="btn-icon relative"
          >
            <ShoppingCart size={18} aria-hidden />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#E8621A] text-white text-[10px] font-bold flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button type="button" className="btn-icon xl:hidden" aria-label="Open menu">
                <Menu size={20} aria-hidden />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw,22rem)] pt-12 bg-[#FAF8F5] border-l border-black/10">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="font-heading text-xl">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-0.5" aria-label="Primary navigation drawer">
                {sheetPrimary.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="px-3 py-3.5 rounded-xl text-base font-medium text-[#1A1A1A]/85 hover:bg-white/80"
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="px-3 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
                  Categories
                </p>
                {OFFICIAL_BROWSABLE_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    to={shopCategoryPath(cat.id)}
                    className="px-3 py-3 rounded-xl text-base font-medium text-[#1A1A1A]/85 hover:bg-white/80"
                  >
                    {cat.label}
                  </Link>
                ))}
                <p className="px-3 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
                  Company
                </p>
                {companyLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="px-3 py-3 rounded-xl text-base font-medium text-[#1A1A1A]/85 hover:bg-white/80"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link to="/cart" className="px-3 py-3.5 rounded-xl text-base font-medium">
                  Cart{itemCount > 0 ? ` (${itemCount})` : ""}
                </Link>
                <Link to="/wishlist" className="px-3 py-3.5 rounded-xl text-base font-medium">
                  Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                </Link>
                <Link to={isAuthenticated ? "/account" : "/auth"} className="px-3 py-3.5 rounded-xl text-base font-medium">
                  {isAuthenticated ? "My Account" : "Sign in"}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
