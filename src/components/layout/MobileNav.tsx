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
    <nav
      aria-label="Primary mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around min-h-16 h-16 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 min-w-[48px] py-1"
            >
              <div className="relative">
                <item.icon
                  size={22}
                  className={isActive ? "text-primary" : "text-muted-foreground"}
                />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
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
