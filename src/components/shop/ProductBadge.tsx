import { cn } from "@/lib/utils";
import type { ProductBadge } from "@/lib/ecommerce/badges";

const styles: Record<ProductBadge["kind"], string> = {
  sale: "bg-[#E8621A] text-white",
  new: "bg-[#1A1A1A] text-white",
  "low-stock": "bg-white/95 text-[#9A3412] ring-1 ring-black/10",
  bestseller: "bg-white/95 text-[#1A1A1A] ring-1 ring-black/10",
  featured: "bg-white/95 text-[#1A1A1A] ring-1 ring-black/10",
};

export function ProductBadgeStack({ badges }: { badges: ProductBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="absolute top-2.5 left-2.5 z-[1] flex flex-col items-start gap-1">
      {badges.map((badge) => (
        <span
          key={badge.kind}
          className={cn(
            "text-[10px] sm:text-[11px] font-bold uppercase tracking-wide px-1.5 py-0.5",
            styles[badge.kind],
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
