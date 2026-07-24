import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { formatINR } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";

export function RecentlyViewedStrip({ excludeId }: { excludeId?: string }) {
  const { items, clear } = useRecentlyViewed();
  const list = items.filter((i) => i.id !== excludeId).slice(0, 8);
  if (list.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-2xl">Recently Viewed</h2>
        <button type="button" onClick={clear} className="text-xs font-semibold text-[#6B6B6B] hover:text-[#E8621A]">
          Clear
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {list.map((item) => (
          <Link
            key={item.id}
            to={productPath(item.slug)}
            className="snap-start shrink-0 w-36 sm:w-40 rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="aspect-[3/4] bg-[#F5F0EB]">
              <img src={item.image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
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
