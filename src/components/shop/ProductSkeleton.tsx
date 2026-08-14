import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden ring-1 ring-black/[0.06] bg-white h-full flex flex-col">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="px-2.5 py-2.5 sm:px-3 sm:py-3 space-y-2 flex-1">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3 mt-2" />
        <Skeleton className="h-3 w-2/5" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Skeleton className="h-10 w-full rounded-none" />
          <Skeleton className="h-10 w-full rounded-none" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductPdpSkeleton() {
  return (
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start" aria-hidden>
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
