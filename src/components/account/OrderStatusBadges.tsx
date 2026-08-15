import { cn } from "@/lib/utils";
import {
  formatCustomerOrderStatus,
  formatCustomerPaymentStatus,
  orderBadgeClass,
  paymentBadgeClass,
} from "@/lib/account/orderDisplay";

export function CustomerPaymentBadge({ value, compact = false }: { value: string; compact?: boolean }) {
  const label = formatCustomerPaymentStatus(value);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        paymentBadgeClass(value),
      )}
      aria-label={`Payment: ${label}`}
    >
      {compact ? label : `Payment: ${label}`}
    </span>
  );
}

export function CustomerFulfillmentBadge({ value, compact = false }: { value: string; compact?: boolean }) {
  const label = formatCustomerOrderStatus(value);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        orderBadgeClass(value),
      )}
      aria-label={`Order: ${label}`}
    >
      {compact ? label : `Order: ${label}`}
    </span>
  );
}
