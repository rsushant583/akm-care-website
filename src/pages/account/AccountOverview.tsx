import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Heart, MapPin, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { listMyOrders, type CustomerOrderListItem } from "@/services/customerOrderService";
import { listAddresses } from "@/services/addressService";
import { formatINR } from "@/lib/ecommerce/pricing";
import { formatOrderDate } from "@/lib/account/orderDisplay";
import { CustomerFulfillmentBadge, CustomerPaymentBadge } from "@/components/account/OrderStatusBadges";
import { customerSafeMessage } from "@/lib/ecommerce/customerCopy";

export default function AccountOverviewPage() {
  const { user, profile } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, a] = await Promise.all([
        listMyOrders(),
        user ? listAddresses(user.id) : Promise.resolve([]),
      ]);
      setOrders(o);
      setAddressCount(a.length);
    } catch (e) {
      setOrders([]);
      setAddressCount(0);
      setError(customerSafeMessage(e, "Could not load your account summary. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
          className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-[#E8621A] min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]"
        >
          Edit profile <ChevronRight size={16} aria-hidden />
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm" role="alert">
          <p className="font-semibold text-red-800">Unable to load account summary</p>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-full bg-[#1A1A1A] text-white px-4 py-2.5 text-sm font-semibold min-h-11"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { to: "/account/orders", label: "Orders", value: loading ? "…" : String(orders.length), icon: Package },
          { to: "/account/wishlist", label: "Wishlist", value: String(wishlistCount), icon: Heart },
          { to: "/account/addresses", label: "Addresses", value: loading ? "…" : String(addressCount), icon: MapPin },
        ].map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-black/[0.06] bg-white p-4 hover:border-[#E8621A]/40 transition-colors min-h-[88px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]"
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
          <Link to="/account/orders" className="text-sm font-semibold text-[#E8621A] min-h-11 inline-flex items-center">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3" aria-busy="true" role="status">
            <span className="sr-only">Loading recent orders</span>
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
                    className="flex gap-3 rounded-xl border border-black/[0.06] p-3 hover:border-[#E8621A]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]"
                  >
                    <div className="h-14 w-12 rounded-lg overflow-hidden bg-[#F5F0EB] shrink-0">
                      {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{o.order_number}</p>
                      <p className="text-xs text-[#6B6B6B]">{formatOrderDate(o.created_at)}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <CustomerPaymentBadge value={o.payment_status} compact />
                        <CustomerFulfillmentBadge value={o.status} compact />
                      </div>
                    </div>
                    <p className="font-semibold text-sm text-[#E8621A] shrink-0">{formatINR(o.grand_total)}</p>
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
