import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyOrders, type CustomerOrderListItem } from "@/services/customerOrderService";
import { formatINR } from "@/lib/ecommerce/pricing";
import {
  formatOrderDateTime,
  trackingAvailabilityLabel,
} from "@/lib/account/orderDisplay";
import { CustomerFulfillmentBadge, CustomerPaymentBadge } from "@/components/account/OrderStatusBadges";
import { customerSafeMessage } from "@/lib/ecommerce/customerCopy";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh && orders.length > 0) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setOrders(await listMyOrders());
    } catch (e) {
      setError(customerSafeMessage(e, "Could not load your orders. Please try again."));
      if (!isRefresh) setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showFullSkeleton = loading && orders.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl">My Orders</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">Orders linked to your signed-in account.</p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading || refreshing}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A] disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {showFullSkeleton ? (
        <div className="space-y-3" aria-busy="true" role="status">
          <span className="sr-only">Loading orders</span>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white border border-black/[0.06] animate-pulse" />
          ))}
        </div>
      ) : error && orders.length === 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm" role="alert">
          <p className="font-semibold text-red-800">Unable to load orders</p>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-full bg-[#1A1A1A] text-white px-4 py-2.5 text-sm font-semibold min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
          <p className="font-heading text-xl mb-2">No orders yet</p>
          <p className="text-sm text-[#6B6B6B] mb-5">When you place an order while signed in, it will appear here.</p>
          <Link
            to="/shop"
            className="inline-flex rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <>
          {error ? (
            <p className="text-sm text-red-700" role="status">
              {error} Showing the last loaded orders.
            </p>
          ) : null}
          {refreshing ? (
            <p className="text-xs text-[#6B6B6B]" role="status" aria-live="polite">
              Updating orders…
            </p>
          ) : null}
          <ul className="space-y-3">
            {orders.map((o) => {
              const first = o.order_items[0];
              const more = Math.max(0, o.order_items.length - 1);
              const qty = o.order_items.reduce((n, it) => n + Number(it.quantity || 0), 0);
              const trackingHint = trackingAvailabilityLabel({
                trackingNumber: o.tracking_number,
                fulfillmentStatus: o.status,
              });
              return (
                <li key={o.id} className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold">{o.order_number}</p>
                      <p className="text-xs text-[#6B6B6B]">Placed on {formatOrderDateTime(o.created_at)}</p>
                    </div>
                    <p className="font-bold text-[#E8621A]">{formatINR(o.grand_total)}</p>
                  </div>

                  {first && (
                    <div className="flex gap-3 mb-3">
                      <div className="h-16 w-14 rounded-lg overflow-hidden bg-[#F5F0EB] shrink-0">
                        {first.image_url ? (
                          <img src={first.image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 text-sm">
                        <p className="font-medium line-clamp-2">{first.product_name}</p>
                        <p className="text-xs text-[#6B6B6B] mt-0.5">
                          Qty {first.quantity}
                          {more > 0 ? ` · +${more} more item${more === 1 ? "" : "s"}` : ""}
                          {qty > 0 ? ` · ${qty} total` : ""}
                        </p>
                        {trackingHint ? (
                          <p className="text-xs text-[#6B6B6B] mt-1">{trackingHint}</p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <CustomerPaymentBadge value={o.payment_status} />
                    <CustomerFulfillmentBadge value={o.status} />
                    <Link
                      to={`/account/orders/${o.id}`}
                      className="ml-auto rounded-full border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F5] min-h-11 inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]"
                    >
                      View order
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
