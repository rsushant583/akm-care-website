import { formatCustomerOrderStatus } from "@/lib/account/orderDisplay";

export type TimelineHistoryRow = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};

export type TimelineStep = {
  id: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "failed";
  at: string | null;
  note?: string | null;
};

const FULFILLMENT_STEPS = [
  { id: "confirmed", label: "Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
] as const;

function fulfillmentRank(status: string): number {
  switch ((status || "").toLowerCase()) {
    case "delivered":
      return 6;
    case "out_for_delivery":
      return 5;
    case "shipped":
      return 4;
    case "packed":
      return 3;
    case "confirmed":
      return 2;
    default:
      return 0;
  }
}

function historyFor(timeline: TimelineHistoryRow[], status: string) {
  const row = timeline.find((t) => (t.status || "").toLowerCase() === status.toLowerCase());
  return row ? { at: row.created_at, note: row.note } : null;
}

/**
 * Visual stepper from authoritative header + optional history.
 * Dates are attached only when a real timestamp exists — never fabricated.
 */
export function buildCustomerOrderTimeline(input: {
  createdAt: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  paymentRecordedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  timeline: TimelineHistoryRow[];
}): { steps: TimelineStep[]; hasHistory: boolean } {
  const fulfillment = (input.fulfillmentStatus || "pending").toLowerCase();
  const payment = (input.paymentStatus || "pending").toLowerCase();
  const rank = fulfillmentRank(fulfillment);
  const terminal = fulfillment === "cancelled" || fulfillment === "returned" || fulfillment === "refunded";
  const hasHistory = input.timeline.length > 0;

  const paymentPaid = payment === "paid";
  const paymentRefunded = payment === "refunded";
  const paymentFailed = payment === "failed";
  const paymentComplete = paymentPaid || paymentRefunded;

  const steps: TimelineStep[] = [
    {
      id: "placed",
      label: "Order placed",
      state: "complete",
      at: input.createdAt,
    },
  ];

  let paymentState: TimelineStep["state"] = "upcoming";
  let paymentNote: string | null = null;
  if (paymentComplete) {
    paymentState = "complete";
    paymentNote = paymentRefunded ? "Refund recorded on the payment record." : null;
  } else if (paymentFailed) {
    paymentState = "failed";
    paymentNote = "Payment was not completed.";
  } else {
    paymentState = "current";
  }

  steps.push({
    id: "payment",
    label: paymentRefunded ? "Payment refunded" : "Payment",
    state: paymentState,
    at: paymentComplete || paymentFailed ? input.paymentRecordedAt || null : null,
    note: paymentNote,
  });

  const pushFulfillmentStep = (id: string, label: string, state: TimelineStep["state"]) => {
    const hist = historyFor(input.timeline, id);
    const extraAt =
      id === "shipped" ? input.shippedAt : id === "delivered" ? input.deliveredAt : null;
    steps.push({
      id,
      label,
      state,
      at: state === "upcoming" ? null : hist?.at || extraAt || null,
      note: hist?.note,
    });
  };

  if (terminal) {
    for (const step of FULFILLMENT_STEPS) {
      const stepRank = fulfillmentRank(step.id);
      if (rank >= stepRank && rank > 0) {
        pushFulfillmentStep(step.id, step.label, rank > stepRank ? "complete" : "current");
      }
    }
    const termHist = historyFor(input.timeline, fulfillment);
    steps.push({
      id: fulfillment,
      label: formatCustomerOrderStatus(fulfillment),
      state: "current",
      at: termHist?.at || null,
      note: termHist?.note,
    });
    return { steps, hasHistory };
  }

  for (const step of FULFILLMENT_STEPS) {
    const stepRank = fulfillmentRank(step.id);
    if (rank > stepRank) {
      pushFulfillmentStep(step.id, step.label, "complete");
    } else if (rank === stepRank && rank > 0) {
      pushFulfillmentStep(step.id, step.label, "current");
    } else {
      pushFulfillmentStep(step.id, step.label, "upcoming");
    }
  }

  return { steps, hasHistory };
}
