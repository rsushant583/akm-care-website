import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import {
  assessCreateShipmentReadiness,
  getAdminShipment,
  runShippingAction,
  type AdminShipmentView,
} from "@/services/adminShippingService";
import type { AdminOrderDetail } from "@/services/adminOrdersService";

const PAST_PICKUP = new Set([
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "rto",
]);

type Props = {
  order: AdminOrderDetail;
  canEdit: boolean;
  onChanged: () => void;
};

export function AdminShippingPanel({ order, canEdit, onChanged }: Props) {
  const [shipment, setShipment] = useState<AdminShipmentView | null>(null);
  const [providerEnabled, setProviderEnabled] = useState<boolean | null>(null);
  const [readinessReasons, setReadinessReasons] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [res, readiness] = await Promise.all([
        getAdminShipment(order.id),
        assessCreateShipmentReadiness(order),
      ]);
      setShipment(res.shipment || null);
      setProviderEnabled(res.enabled ?? null);
      setReadinessReasons(readiness.reasons);
    } catch (e) {
      // get may fail if function not deployed yet
      setProviderEnabled(false);
      const readiness = await assessCreateShipmentReadiness(order);
      setReadinessReasons(readiness.reasons);
      if (e instanceof Error && !/FunctionsFetchError|Failed to send/i.test(e.message)) {
        toast.error(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [order]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (action: Parameters<typeof runShippingAction>[0]) => {
    if (!canEdit) return;
    setBusy(action);
    try {
      const res = await runShippingAction(action, order.id);
      setShipment(res.shipment || null);
      setProviderEnabled(res.enabled ?? true);
      toast.success(`Shipping: ${action.replace(/_/g, " ")} succeeded`);
      onChanged();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Shipping action failed");
    } finally {
      setBusy(null);
    }
  };

  const paid = order.payment_status === "paid";
  const hasActive = Boolean(shipment && shipment.status !== "cancelled");
  const canCreate =
    canEdit &&
    paid &&
    !hasActive &&
    readinessReasons.length === 0 &&
    providerEnabled === true;
  const canCancel =
    canEdit && hasActive && shipment && !PAST_PICKUP.has(shipment.status);

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3">
      <h2 className="font-semibold">Provider shipping</h2>

      {loading ? (
        <p className="text-sm text-slate-500">Loading shipping…</p>
      ) : (
        <>
          <div className="text-sm space-y-1">
            <p>
              Payment: <span className="font-medium">{paid ? "PAID ✓" : order.payment_status.toUpperCase()}</span>
            </p>
            <p>
              Order: <span className="font-medium capitalize">{order.status.replace(/_/g, " ")}</span>
            </p>
            <p>
              Shipping:{" "}
              <span className="font-medium">
                {hasActive ? String(shipment?.status || "").replace(/_/g, " ").toUpperCase() : "NOT CREATED"}
              </span>
            </p>
            {providerEnabled === false && (
              <p className="text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs">
                Shipping provider is disabled (`SHIPPING_PROVIDER_ENABLED=false`). Checkout and Razorpay are
                unchanged. Configure credentials + parcel profile before enabling.
              </p>
            )}
          </div>

          {!hasActive && (
            <div className="space-y-2">
              {readinessReasons.length > 0 && (
                <ul className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 list-disc pl-5">
                  {readinessReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                disabled={!canCreate || busy !== null}
                onClick={() => void run("create")}
                className="rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {busy === "create" ? "Creating…" : "Create Shipment"}
              </button>
              {canEdit && providerEnabled === true && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void run("recover")}
                  className="ml-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {busy === "recover" ? "Recovering…" : "Recover Shipment"}
                </button>
              )}
            </div>
          )}

          {hasActive && shipment && (
            <div className="space-y-3">
              <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-slate-500">Provider order ID</dt>
                  <dd className="font-medium break-all">{shipment.provider_order_id || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Shipment ID</dt>
                  <dd className="font-medium break-all">{shipment.provider_shipment_id || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Courier</dt>
                  <dd className="font-medium">{shipment.courier_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">AWB</dt>
                  <dd className="font-medium">{shipment.awb_code || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">ETD</dt>
                  <dd className="font-medium">
                    {shipment.etd ? new Date(shipment.etd).toLocaleString("en-IN") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium capitalize">{shipment.status.replace(/_/g, " ")}</dd>
                </div>
              </dl>
              {shipment.last_error && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {shipment.last_error}
                </p>
              )}
              {shipment.label_url && (
                <a
                  href={shipment.label_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-orange-600 underline"
                >
                  Open label PDF
                </a>
              )}
              {shipment.tracking_url && (
                <a
                  href={shipment.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-semibold text-orange-600 underline"
                >
                  Open tracking link
                </a>
              )}

              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  <ActionBtn
                    label="Generate AWB"
                    disabled={Boolean(shipment.awb_code) || busy !== null}
                    busy={busy === "assign_awb"}
                    onClick={() => void run("assign_awb")}
                  />
                  <ActionBtn
                    label="Generate Label"
                    disabled={!shipment.awb_code || Boolean(shipment.label_url) || busy !== null}
                    busy={busy === "generate_label"}
                    onClick={() => void run("generate_label")}
                  />
                  <ActionBtn
                    label="Schedule Pickup"
                    disabled={!shipment.awb_code || PAST_PICKUP.has(shipment.status) || busy !== null}
                    busy={busy === "schedule_pickup"}
                    onClick={() => void run("schedule_pickup")}
                  />
                  <ActionBtn
                    label="Refresh tracking"
                    disabled={!shipment.awb_code || busy !== null}
                    busy={busy === "track"}
                    onClick={() => void run("track")}
                  />
                  <ActionBtn
                    label="Cancel Shipment"
                    disabled={!canCancel || busy !== null}
                    busy={busy === "cancel"}
                    onClick={() => void run("cancel")}
                    danger
                  />
                  <ActionBtn
                    label="Recover"
                    disabled={busy !== null}
                    busy={busy === "recover"}
                    onClick={() => void run("recover")}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  busy,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
        danger ? "border-red-200 text-red-700" : ""
      }`}
    >
      {busy ? "Working…" : label}
    </button>
  );
}
