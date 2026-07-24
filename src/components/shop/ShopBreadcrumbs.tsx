import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShopBreadcrumbs({
  items,
  className,
}: {
  items: { name: string; url?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-[#6B6B6B]", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} className="opacity-50" aria-hidden />}
              {last || !item.url ? (
                <span className={cn(last && "text-[#1A1A1A] font-medium")} aria-current={last ? "page" : undefined}>
                  {item.name}
                </span>
              ) : (
                <Link to={item.url} className="hover:text-[#E8621A] transition-colors">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
