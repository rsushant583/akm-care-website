import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  UserRound,
  LogOut,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/orders", label: "My Orders", icon: Package },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/profile", label: "Profile", icon: UserRound },
] as const;

export default function AccountLayout() {
  const { user, profile, signOut } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="My Account"
        description="Manage your AKM Care orders, wishlist, addresses, and profile."
        canonical="/account"
        robots="noindex, follow"
      />
      <section className="section-padding bg-[#FAF8F5] min-h-[70vh] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-16">
        <div className="container-premium">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl text-[#1A1A1A]">My Account</h1>
              <p className="text-sm text-[#6B6B6B] mt-1">
                {profile?.full_name || user?.email || "Welcome back"}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/auth");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold min-h-11"
            >
              <LogOut size={16} aria-hidden /> Sign out
            </button>
          </div>

          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 items-start">
            <nav
              className="mb-6 lg:mb-0 lg:sticky lg:top-24 flex lg:flex-col gap-2 overflow-x-auto pb-1 -mx-1 px-1"
              aria-label="Account sections"
            >
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center gap-2 rounded-full lg:rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap border min-h-11 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]",
                      isActive
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-white text-[#1A1A1A] border-black/10 hover:border-[#E8621A]/40",
                    )
                  }
                >
                  <item.icon size={16} aria-hidden />
                  {item.label}
                  {item.to === "/account/wishlist" && wishlistCount > 0 ? (
                    <span className="text-xs opacity-80">({wishlistCount})</span>
                  ) : null}
                </NavLink>
              ))}
            </nav>

            <div className="min-w-0">
              <Outlet />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
