import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { getAnalytics } from "@/services/adminCmsService";
import { getSalesSeries } from "@/services/adminDashboardService";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAnalytics>> | null>(null);
  const [series, setSeries] = useState<Awaited<ReturnType<typeof getSalesSeries>>>([]);

  useEffect(() => {
    void Promise.all([getAnalytics(), getSalesSeries(30)])
      .then(([a, s]) => {
        setData(a);
        setSeries(s);
      })
      .catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Analytics" subtitle="Top sellers, low stock, new customers, and category performance." />

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-semibold mb-3">Sales overview (30 days)</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#E8621A" name="Revenue" radius={[6, 6, 0, 0]} />
              <Bar dataKey="orders" fill="#0f172a" name="Orders" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Top selling products">
          {(data?.topSelling || []).map((r: any, i: number) => (
            <Row key={i} label={r.name} value={String(r.qty)} />
          ))}
        </Panel>
        <Panel title="Low stock">
          {(data?.lowStock || []).map((r: any) => (
            <Row key={r.id} label={r.name} value={String(r.stock_quantity)} />
          ))}
        </Panel>
        <Panel title="New customers">
          {(data?.newCustomers || []).map((r: any) => (
            <Row key={r.id} label={r.full_name || r.email || r.id} value={new Date(r.created_at).toLocaleDateString()} />
          ))}
        </Panel>
        <Panel title="Category performance">
          {(data?.categoryPerf || []).map((r: any) => (
            <Row key={r.name} label={r.name} value={`${r.value} products`} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="truncate">{label}</span>
      <span className="font-semibold shrink-0">{value}</span>
    </div>
  );
}
