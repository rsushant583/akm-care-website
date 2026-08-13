import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/sonner";
import { formatINR } from "@/lib/ecommerce/pricing";
import { formatPaymentStatus } from "@/lib/admin/orderFulfillment";
import { getAdminOrderById, type AdminOrderListRow } from "@/services/adminOrdersService";

export type AdminOrderLiveEvent = {
  type: "insert" | "update" | "reconnect";
  id?: string;
  at: number;
  row?: AdminOrderListRow;
};

type Ctx = {
  unseenIds: string[];
  unseenCount: number;
  lastEvent: AdminOrderLiveEvent | null;
  live: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (on: boolean) => void;
  markSeen: (id: string) => void;
  isUnseen: (id: string) => boolean;
};

const AdminOrderAlertsContext = createContext<Ctx | null>(null);

type HeaderPayload = {
  id?: string;
  order_number?: string;
  grand_total?: number;
  payment_status?: string;
  customer_name?: string;
};

function playSoftChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
    window.setTimeout(() => void ctx.close(), 300);
  } catch {
    /* autoplay or AudioContext unavailable */
  }
}

export function AdminOrderAlertsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [unseenIds, setUnseenIds] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<AdminOrderLiveEvent | null>(null);
  const [live, setLive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const notifiedRef = useRef(new Set<string>());
  const soundRef = useRef(false);
  const mountedRef = useRef(true);

  soundRef.current = soundEnabled;

  const markSeen = useCallback((id: string) => {
    setUnseenIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const isUnseen = useCallback((id: string) => unseenIds.includes(id), [unseenIds]);

  useEffect(() => {
    mountedRef.current = true;
    const client = getSupabaseClient();
    if (!client) return;

    const onInsert = async (payload: RealtimePostgresChangesPayload<HeaderPayload>) => {
      const id = String(payload.new?.id || "");
      if (!id || notifiedRef.current.has(id)) return;
      notifiedRef.current.add(id);

      let row: AdminOrderListRow | null = null;
      try {
        row = await getAdminOrderById(id);
      } catch {
        row = null;
      }
      if (!mountedRef.current) return;

      const orderNumber = row?.order_number || String(payload.new?.order_number || "New order");
      const items = row?.order_items || [];
      const firstItem = items[0]
        ? `${items[0].product_name} × ${items[0].quantity}`
        : "Items pending";
      const more = items.length > 1 ? ` +${items.length - 1} more` : "";
      const amount = formatINR(Number(row?.grand_total ?? payload.new?.grand_total ?? 0));
      const pay = formatPaymentStatus(String(row?.payment_status || payload.new?.payment_status || "pending"));

      toast.message("New order", {
        description: `${orderNumber}\n${firstItem}${more}\n${amount} · Payment: ${pay}`,
        duration: 14000,
        action: {
          label: "View order",
          onClick: () => navigate(`/admin/orders/${id}`),
        },
      });

      if (soundRef.current) playSoftChime();

      setUnseenIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
      setLastEvent({ type: "insert", id, at: Date.now(), row: row || undefined });
    };

    const onUpdate = (payload: RealtimePostgresChangesPayload<HeaderPayload>) => {
      const id = String(payload.new?.id || "");
      if (!id) return;
      setLastEvent({ type: "update", id, at: Date.now() });
    };

    const channel = client
      .channel("admin-order-headers")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_headers" }, onInsert)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "order_headers" }, onUpdate)
      .subscribe((status) => {
        if (!mountedRef.current) return;
        if (status === "SUBSCRIBED") {
          setLive(true);
          setLastEvent({ type: "reconnect", at: Date.now() });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setLive(false);
        }
      });

    return () => {
      mountedRef.current = false;
      void client.removeChannel(channel);
    };
  }, [navigate]);

  const value = useMemo<Ctx>(
    () => ({
      unseenIds,
      unseenCount: unseenIds.length,
      lastEvent,
      live,
      soundEnabled,
      setSoundEnabled,
      markSeen,
      isUnseen,
    }),
    [unseenIds, lastEvent, live, soundEnabled, markSeen, isUnseen],
  );

  return <AdminOrderAlertsContext.Provider value={value}>{children}</AdminOrderAlertsContext.Provider>;
}

export function useAdminOrderAlerts() {
  const ctx = useContext(AdminOrderAlertsContext);
  if (!ctx) throw new Error("useAdminOrderAlerts must be used within AdminOrderAlertsProvider");
  return ctx;
}
