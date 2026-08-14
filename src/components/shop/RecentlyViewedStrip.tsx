import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { formatINR } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { cn } from "@/lib/utils";

export function RecentlyViewedStrip({
  excludeId,
  className,
}: {
  excludeId?: string;
  className?: string;
}) {
  const { items, clear } = useRecentlyViewed();
  const seen = new Set<string>();
  const list = items
    .filter((i) => i.id !== excludeId && !seen.has(i.id) && (seen.add(i.id), true))
    .slice(0, 8);
  if (list.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="recently-viewed-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recently-viewed-heading" className="type-section text-xl sm:text-2xl">
          Recently viewed
        </h2>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-[#6B6B6B] hover:text-[#E8621A] min-h-9 px-1"
        >
          Clear
        </button>
      </div>
      <div
        className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1"
        role="list"
        aria-label="Recently viewed products"
      >
        {list.map((item) => (
          <Link
            key={item.id}
            to={productPath(item.slug)}
            role="listitem"
            className="snap-start shrink-0 w-36 sm:w-40 overflow-hidden bg-white ring-1 ring-black/[0.06] hover:ring-black/[0.12] transition-all"
          >
            <div className="aspect-[3/4] bg-[#F5F0EB]">
              <img
                src={item.image || "/placeholder.svg"}
                alt=""
                className="h-full w-full product-photo"
                loading="lazy"
              />
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium line-clamp-2 min-h-[2rem]">{item.name}</p>
              <p className="text-sm font-semibold text-[#E8621A] mt-1">{formatINR(item.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
