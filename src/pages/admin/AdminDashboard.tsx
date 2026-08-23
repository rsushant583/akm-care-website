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
  FileEdit,
  ImageOff,
  Tag,
  Clock,
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
import { loadCatalogSettings } from "@/lib/admin/catalogSettings";

const COLORS = ["#E8621A", "#0f172a", "#10b981", "#6366f1", "#f59e0b", "#94a3b8"];

export default function AdminDashboardPage() {
  const { lastEvent } = useAdminOrderAlerts();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [series, setSeries] = useState<Awaited<ReturnType<typeof getSalesSeries>>>([]);
  const [dist, setDist] = useState<Awaited<ReturnType<typeof getCategoryDistribution>>>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const skipFirstReconnect = useRef(true);

  const refresh = (threshold = lowStockThreshold) => {
    void Promise.all([
      getDashboardStats({ lowStockThreshold: threshold }),
      getSalesSeries(14),
      getCategoryDistribution(),
    ]).then(([s, ser, d]) => {
      setStats(s);
      setSeries(ser);
      setDist(d);
    });
  };

  useEffect(() => {
    void loadCatalogSettings().then((cfg) => {
      setLowStockThreshold(cfg.low_stock_threshold);
      refresh(cfg.low_stock_threshold);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "reconnect" && skipFirstReconnect.current) {
      skipFirstReconnect.current = false;
      return;
    }
    const t = window.setTimeout(() => refresh(), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on order alert events only
  }, [lastEvent]);

  const cards = [
    { label: "Published products", value: stats?.activeProducts ?? "—", icon: CheckCircle2, to: "/admin/products?status=available" },
    { label: "Draft products", value: stats?.draftProducts ?? "—", icon: FileEdit, to: "/admin/products?status=draft" },
    { label: "Low stock", value: stats?.lowStock ?? "—", icon: AlertTriangle, to: "/admin/products?stock=low_stock" },
    { label: "Out of stock", value: stats?.outOfStock ?? "—", icon: Package, to: "/admin/products?stock=out_of_stock" },
    { label: "Missing images", value: stats?.missingImage ?? "—", icon: ImageOff, to: "/admin/products?quality=missing_image" },
    { label: "Missing category", value: stats?.missingCategory ?? "—", icon: Tag, to: "/admin/products?quality=missing_category" },
    { label: "Pending orders", value: stats?.pendingOrders ?? "—", icon: ShoppingBag, to: "/admin/orders?status=pending" },
    { label: "Today's orders", value: stats?.todayOrders ?? "—", icon: Clock, to: "/admin/orders" },
    { label: "Revenue (paid)", value: stats ? formatINR(stats.revenue) : "—", icon: IndianRupee, to: "/admin/analytics" },
    { label: "Customers", value: stats?.customers ?? "—", icon: Users, to: "/admin/customers" },
    { label: "Categories (DB)", value: stats?.categories ?? "—", icon: FolderTree, to: "/admin/categories" },
    { label: "All products", value: stats?.totalProducts ?? "—", icon: Package, to: "/admin/products" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Live catalog and order signals. Low-stock threshold: {lowStockThreshold} units.
          </p>
        </div>
        <Link to="/admin/catalog-quality" className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
          Data quality report
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-2xl bg-white border border-slate-200 p-4 hover:border-orange-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
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
