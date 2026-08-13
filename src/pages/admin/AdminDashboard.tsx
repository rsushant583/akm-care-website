import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  ShoppingBag,
  IndianRupee,
  Users,
  Store,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getCategoryDistribution,
  getDashboardStats,
  getSalesSeries,
} from "@/services/adminDashboardService";
import { formatINR } from "@/lib/ecommerce/pricing";
import { useAdminOrderAlerts } from "@/context/AdminOrderAlertsContext";

const COLORS = ["#E8621A", "#0f172a", "#10b981", "#6366f1", "#f59e0b", "#94a3b8"];

export default function AdminDashboardPage() {
  const { lastEvent } = useAdminOrderAlerts();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [series, setSeries] = useState<Awaited<ReturnType<typeof getSalesSeries>>>([]);
  const [dist, setDist] = useState<Awaited<ReturnType<typeof getCategoryDistribution>>>([]);
  const skipFirstReconnect = useRef(true);

  const refresh = () => {
    void Promise.all([getDashboardStats(), getSalesSeries(14), getCategoryDistribution()]).then(
      ([s, ser, d]) => {
        setStats(s);
        setSeries(ser);
        setDist(d);
      },
    );
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "reconnect" && skipFirstReconnect.current) {
      skipFirstReconnect.current = false;
      return;
    }
    const t = window.setTimeout(refresh, 400);
    return () => window.clearTimeout(t);
  }, [lastEvent]);

  const cards = [
    { label: "Total Products", value: stats?.totalProducts ?? "—", icon: Package, to: "/admin/products" },
    { label: "Active Products", value: stats?.activeProducts ?? "—", icon: CheckCircle2, to: "/admin/products" },
    { label: "Out of Stock", value: stats?.outOfStock ?? "—", icon: AlertTriangle, to: "/admin/inventory" },
    { label: "Categories", value: stats?.categories ?? "—", icon: FolderTree, to: "/admin/categories" },
    { label: "Orders", value: stats?.orders ?? "—", icon: ShoppingBag, to: "/admin/orders" },
    { label: "Revenue", value: stats ? formatINR(stats.revenue) : "—", icon: IndianRupee, to: "/admin/analytics" },
    { label: "Customers", value: stats?.customers ?? "—", icon: Users, to: "/admin/customers" },
    { label: "Vendors", value: stats?.vendors ?? "—", icon: Store, to: "/admin/inbox", hint: "Future-ready" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Platform overview for AKM Care operations.</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-2xl bg-white border border-slate-200 p-4 hover:border-orange-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
                {c.hint && <p className="text-[10px] text-slate-400 mt-1">{c.hint}</p>}
              </div>
              <span className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <c.icon size={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-4">
          <h2 className="font-semibold mb-3">Orders & revenue (14 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="orders" stroke="#0f172a" fill="#cbd5e1" name="Orders" />
                <Area type="monotone" dataKey="revenue" stroke="#E8621A" fill="#fed7aa" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <h2 className="font-semibold mb-3">Product distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" outerRadius={90} label>
                  {dist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <h2 className="font-semibold mb-3">Daily sales trend</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#E8621A" name="Revenue" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
