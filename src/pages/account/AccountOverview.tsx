import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Heart, MapPin, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { listMyOrders, type CustomerOrderListItem } from "@/services/customerOrderService";
import { listAddresses } from "@/services/addressService";
import { formatINR } from "@/lib/ecommerce/pricing";
import {
  formatCustomerOrderStatus,
  formatCustomerPaymentStatus,
  orderBadgeClass,
  paymentBadgeClass,
} from "@/lib/account/orderDisplay";
import { cn } from "@/lib/utils";

export default function AccountOverviewPage() {
  const { user, profile } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [o, a] = await Promise.all([
          listMyOrders(),
          user ? listAddresses(user.id) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setOrders(o);
          setAddressCount(a.length);
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setAddressCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const recent = orders.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wide text-[#6B6B6B] font-semibold">Profile</p>
        <h2 className="font-heading text-2xl mt-1">{profile?.full_name || "Your account"}</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">{user?.email}</p>
        {profile?.phone && <p className="text-sm text-[#6B6B6B]">{profile.phone}</p>}
        <Link
          to="/account/profile"
          className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-[#E8621A] min-h-11"
        >
          Edit profile <ChevronRight size={16} aria-hidden />
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { to: "/account/orders", label: "Orders", value: loading ? "…" : String(orders.length), icon: Package },
          { to: "/account/wishlist", label: "Wishlist", value: String(wishlistCount), icon: Heart },
          { to: "/account/addresses", label: "Addresses", value: loading ? "…" : String(addressCount), icon: MapPin },
        ].map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-black/[0.06] bg-white p-4 hover:border-[#E8621A]/40 transition-colors min-h-[88px]"
          >
            <c.icon size={18} className="text-[#E8621A]" aria-hidden />
            <p className="text-2xl font-bold mt-2">{c.value}</p>
            <p className="text-xs uppercase tracking-wide text-[#6B6B6B] font-semibold">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-heading text-xl">Recent orders</h2>
          <Link to="/account/orders" className="text-sm font-semibold text-[#E8621A]">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-[#F5F0EB] animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">
            No orders yet.{" "}
            <Link to="/shop" className="font-semibold text-[#E8621A]">
              Start shopping
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {recent.map((o) => {
              const thumb = o.order_items[0]?.image_url;
              return (
                <li key={o.id}>
                  <Link
                    to={`/account/orders/${o.id}`}
                    className="flex gap-3 rounded-xl border border-black/[0.06] p-3 hover:border-[#E8621A]/40"
                  >
                    <div className="h-14 w-12 rounded-lg overflow-hidden bg-[#F5F0EB] shrink-0">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{o.order_number}</p>
                      <p className="text-xs text-[#6B6B6B]">
                        {new Date(o.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                            paymentBadgeClass(o.payment_status),
                          )}
                        >
                          {formatCustomerPaymentStatus(o.payment_status)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                            orderBadgeClass(o.status),
                          )}
                        >
                          {formatCustomerOrderStatus(o.status)}
                        </span>
                      </div>
                    </div>
                    <p className="font-semibold text-sm text-[#E8621A] shrink-0">
                      {formatINR(o.grand_total)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/shop"
          className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 inline-flex items-center"
        >
          Continue shopping
        </Link>
        <Link
          to="/cart"
          className="rounded-full border border-black/10 bg-white font-semibold px-5 py-2.5 text-sm min-h-11 inline-flex items-center"
        >
          View cart
        </Link>
      </div>
    </div>
  );
}
