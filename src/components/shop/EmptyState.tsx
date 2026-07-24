import { Link } from "react-router-dom";
import { PackageOpen, ShoppingBag } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionLabel = "Continue Shopping",
  actionHref = "/shop",
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-black/10 bg-[#FAF8F5]">
      <div className="h-14 w-14 rounded-full bg-[#E8621A]/10 text-[#E8621A] flex items-center justify-center mb-4">
        <PackageOpen size={28} />
      </div>
      <h3 className="font-heading text-xl text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm text-[#6B6B6B] max-w-md mb-6">{description}</p>
      <Link
        to={actionHref}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E8621A] text-white text-sm font-semibold hover:brightness-105"
      >
        <ShoppingBag size={16} />
        {actionLabel}
      </Link>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-destructive/20 bg-destructive/5">
      <h3 className="font-heading text-xl text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm text-[#6B6B6B] max-w-md mb-6">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-full bg-[#E8621A] text-white text-sm font-semibold"
        >
          Try again
        </button>
      )}
    </div>
  );
}
