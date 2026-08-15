import { buildCustomerOrderTimeline, type TimelineHistoryRow } from "@/lib/account/orderTimeline";
import { formatOrderDateTime } from "@/lib/account/orderDisplay";
import { cn } from "@/lib/utils";

export function OrderTimeline(props: {
  createdAt: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  paymentRecordedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  timeline: TimelineHistoryRow[];
}) {
  const { steps, hasHistory } = buildCustomerOrderTimeline(props);

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
      <h3 className="font-semibold mb-3">Order timeline</h3>
      <ol className="space-y-3" aria-label="Order progress">
        {steps.map((step) => {
          const stateLabel =
            step.state === "complete"
              ? "Completed"
              : step.state === "current"
                ? "Current"
                : step.state === "failed"
                  ? "Not completed"
                  : "Not reached yet";
          return (
            <li key={step.id} className="flex gap-3 text-sm">
              <span
                className={cn(
                  "mt-1.5 h-2.5 w-2.5 rounded-full shrink-0",
                  step.state === "complete" && "bg-[#E8621A]",
                  step.state === "current" && "bg-[#1A1A1A] ring-4 ring-black/10",
                  step.state === "failed" && "bg-red-600",
                  step.state === "upcoming" && "bg-black/20",
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-medium",
                    step.state === "upcoming" && "text-[#6B6B6B]",
                    step.state === "failed" && "text-red-700",
                  )}
                >
                  <span className="sr-only">{stateLabel}: </span>
                  {step.label}
                </p>
                {step.at ? (
                  <p className="text-xs text-[#6B6B6B]">
                    <time dateTime={step.at}>{formatOrderDateTime(step.at)}</time>
                  </p>
                ) : step.state !== "upcoming" ? (
                  <p className="text-xs text-[#6B6B6B]">Date not recorded</p>
                ) : null}
                {step.note ? <p className="text-xs text-[#6B6B6B] mt-0.5">{step.note}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      {!hasHistory ? (
        <p className="text-sm text-[#6B6B6B] mt-4" role="note">
          No status history available yet.
        </p>
      ) : null}
    </section>
  );
}
