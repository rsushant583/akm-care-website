import { cn } from "@/lib/utils";
import { formatOrderStatus, formatPaymentStatus } from "@/lib/admin/orderFulfillment";

export function PaymentBadge({ value }: { value: string }) {
  const v = (value || "pending").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        v === "paid" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        v === "failed" && "border-red-200 bg-red-50 text-red-800",
        v === "pending" && "border-amber-200 bg-amber-50 text-amber-800",
        v === "created" && "border-sky-200 bg-sky-50 text-sky-800",
        v === "refunded" && "border-slate-200 bg-slate-100 text-slate-700",
        !["paid", "failed", "pending", "created", "refunded"].includes(v) &&
          "border-slate-200 bg-slate-50 text-slate-700",
      )}
      aria-label={`Payment status: ${formatPaymentStatus(v)}`}
    >
      Payment: {formatPaymentStatus(v)}
    </span>
  );
}

export function FulfillmentBadge({ value }: { value: string }) {
  const v = (value || "pending").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        v === "confirmed" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        (v === "failed" || v === "cancelled") && "border-red-200 bg-red-50 text-red-800",
        v === "pending" && "border-amber-200 bg-amber-50 text-amber-900",
        ["packed", "shipped", "out_for_delivery"].includes(v) && "border-indigo-200 bg-indigo-50 text-indigo-800",
        v === "delivered" && "border-slate-800 bg-slate-900 text-white",
      )}
      aria-label={`Order status: ${formatOrderStatus(v)}`}
    >
      Order: {formatOrderStatus(v)}
    </span>
  );
}
