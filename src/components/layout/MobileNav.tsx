import { Link, useLocation } from "react-router-dom";
import { Home, Briefcase, ShoppingBag, Play, Phone } from "lucide-react";

const items = [
  { label: "Home", path: "/", icon: Home },
  { label: "Services", path: "/services", icon: Briefcase },
  { label: "Shop", path: "/shop", icon: ShoppingBag },
  { label: "Media", path: "/media", icon: Play },
  { label: "Contact", path: "/contact", icon: Phone },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-[rgba(253,250,247,0.95)] backdrop-blur-[20px] border-t border-black/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] py-1"
            >
              <div className="relative">
                <item.icon
                  size={22}
                  className={`transition-all duration-200 ${isActive ? "text-primary scale-110" : "text-black/40"}`}
                />
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-[0.06em] ${
                  isActive ? "text-primary" : "text-black/40"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
