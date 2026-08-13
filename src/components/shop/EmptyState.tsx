import { Link } from "react-router-dom";
import { PackageOpen, ShoppingBag, X } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionLabel = "Browse all products",
  actionHref = "/shop",
  onClearFilters,
  clearLabel = "Clear filters",
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onClearFilters?: () => void;
  clearLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl border border-dashed border-black/10 bg-[#FAF8F5]">
      <div className="h-14 w-14 rounded-full bg-[#E8621A]/10 text-[#E8621A] flex items-center justify-center mb-4">
        <PackageOpen size={28} aria-hidden />
      </div>
      <h3 className="font-heading text-xl text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm text-[#6B6B6B] max-w-md mb-6">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/10 bg-white text-sm font-semibold text-[#1A1A1A] hover:border-[#E8621A]/35"
          >
            <X size={16} aria-hidden />
            {clearLabel}
          </button>
        )}
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E8621A] text-white text-sm font-semibold hover:brightness-105"
        >
          <ShoppingBag size={16} aria-hidden />
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Unable to load products right now",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl border border-destructive/20 bg-destructive/5">
      <h3 className="font-heading text-xl text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm text-[#6B6B6B] max-w-md mb-6">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-full bg-[#E8621A] text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
        >
          Try again
        </button>
      )}
    </div>
  );
}
