import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyOrders, type CustomerOrderListItem } from "@/services/customerOrderService";
import { formatINR } from "@/lib/ecommerce/pricing";
import {
  formatCustomerOrderStatus,
  formatCustomerPaymentStatus,
  orderBadgeClass,
  paymentBadgeClass,
} from "@/lib/account/orderDisplay";
import { cn } from "@/lib/utils";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await listMyOrders());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl">My Orders</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">Orders linked to your signed-in account.</p>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" role="status">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white border border-black/[0.06] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm">
          <p className="font-semibold text-red-800">Unable to load orders</p>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-full bg-[#1A1A1A] text-white px-4 py-2 text-sm font-semibold"
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
            className="inline-flex rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 items-center"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const first = o.order_items[0];
            const more = Math.max(0, o.order_items.length - 1);
            const qty = o.order_items.reduce((n, it) => n + Number(it.quantity || 0), 0);
            return (
              <li key={o.id} className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold">{o.order_number}</p>
                    <p className="text-xs text-[#6B6B6B]">
                      Placed on{" "}
                      {new Date(o.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
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
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      paymentBadgeClass(o.payment_status),
                    )}
                    aria-label={`Payment: ${formatCustomerPaymentStatus(o.payment_status)}`}
                  >
                    Payment: {formatCustomerPaymentStatus(o.payment_status)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
                      orderBadgeClass(o.status),
                    )}
                    aria-label={`Order: ${formatCustomerOrderStatus(o.status)}`}
                  >
                    Order: {formatCustomerOrderStatus(o.status)}
                  </span>
                  <Link
                    to={`/account/orders/${o.id}`}
                    className="ml-auto rounded-full border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F5] min-h-11 inline-flex items-center"
                  >
                    View order
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
