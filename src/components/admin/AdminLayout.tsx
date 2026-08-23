import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Award,
  Warehouse,
  ShoppingBag,
  Users,
  Image,
  Ticket,
  FileText,
  Images,
  BarChart3,
  Settings,
  Inbox,
  HelpCircle,
  Briefcase,
  Quote,
  LogOut,
  Menu,
  X,
  FileUp,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/SEO";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminOrderAlertsProvider, useAdminOrderAlerts } from "@/context/AdminOrderAlertsContext";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/catalog-quality", label: "Data quality", icon: ClipboardList },
  { to: "/admin/catalog-import", label: "Bulk import", icon: FileUp },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/brands", label: "Brands", icon: Award },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/media", label: "Media", icon: Images },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/inbox", label: "Inbox", icon: Inbox },
  { to: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { to: "/admin/services", label: "Services", icon: Briefcase },
  { to: "/admin/motivation", label: "Motivation", icon: Quote },
  { to: "/admin/settings", label: "Store Settings", icon: Settings },
];

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500" role="status">
        Checking admin session…
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function AdminShell() {
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const { unseenCount } = useAdminOrderAlerts();
  const [open, setOpen] = useState(false);

  return (
    <>
      <SEO title="Admin" description="AKM Care Admin Portal" canonical="/admin" robots="noindex, nofollow" />
      <div className="min-h-screen bg-slate-100 text-slate-900 flex">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-100 flex flex-col transition-transform lg:translate-x-0 lg:static",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
            <div>
              <p className="font-semibold tracking-wide">AKM Admin</p>
              <p className="text-[10px] uppercase text-orange-400">{admin?.role?.replace("_", " ")}</p>
            </div>
            <button type="button" className="lg:hidden p-2" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-orange-500 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <item.icon size={16} />
                {item.label}
                {item.to === "/admin/orders" && unseenCount > 0 && (
                  <span
                    className="ml-auto rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5"
                    aria-label={`${unseenCount} new orders`}
                  >
                    {unseenCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/admin/login");
            }}
            className="m-3 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center gap-3 sticky top-0 z-20">
            <button type="button" className="lg:hidden p-2 rounded-lg border" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="flex-1">
              <p className="text-sm font-semibold">AKM Care Control Center</p>
              <p className="text-xs text-slate-500">{admin?.full_name || admin?.user_id}</p>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout() {
  return (
    <AdminOrderAlertsProvider>
      <AdminShell />
    </AdminOrderAlertsProvider>
  );
}
