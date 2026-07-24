import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/ecommerce/types";
import { cn } from "@/lib/utils";

function LazyImage({
  src,
  alt,
  className,
  priority,
  onLoad,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative h-full w-full bg-[#F0EBE4]", className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#F5F0EB] via-[#EDE6DC] to-[#F5F0EB]" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[#6B6B6B]">Image unavailable</div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={900}
          height={1200}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => {
            setLoaded(true);
            onLoad?.();
          }}
          onError={() => setError(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      )}
    </div>
  );
}

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const list = images.length ? images : [{ src: "/placeholder.svg", alt: productName }];
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const current = list[Math.min(active, list.length - 1)];

  const go = useCallback(
    (dir: -1 | 1) => {
      setActive((a) => (a + dir + list.length) % list.length);
    },
    [list.length],
  );

  useEffect(() => {
    setActive(0);
  }, [images]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen, go]);

  const onMove = (e: React.MouseEvent) => {
    const el = mainRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    go(dx < 0 ? 1 : -1);
  };

  return (
    <>
      <div className="space-y-3">
        <div
          ref={mainRef}
          className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-black/[0.06] bg-[#F5F0EB] group shadow-sm"
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={onMove}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className={cn("h-full w-full transition-transform duration-200 ease-out", zooming && "scale-[1.65]")}
            style={zooming ? { transformOrigin: `${origin.x}% ${origin.y}%` } : undefined}
          >
            <LazyImage src={current.src} alt={current.alt || productName} priority className="h-full w-full" />
          </div>

          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/95 border border-black/10 flex items-center justify-center shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            aria-label="Open fullscreen gallery"
          >
            <Expand size={16} />
          </button>

          <span className="hidden sm:inline-flex absolute bottom-3 right-3 items-center gap-1 rounded-full bg-black/50 text-white text-xs px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={12} /> Hover to zoom
          </span>

          {list.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/95 border border-black/10 flex items-center justify-center shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/95 border border-black/10 flex items-center justify-center shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {list.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    onClick={() => setActive(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === active ? "w-5 bg-[#E8621A]" : "w-1.5 bg-white/80",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {list.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {list.map((img, i) => (
              <button
                key={`${img.src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "snap-start shrink-0 h-16 w-14 sm:h-20 sm:w-16 rounded-lg overflow-hidden border-2 transition-all",
                  i === active ? "border-[#E8621A] shadow-sm" : "border-transparent opacity-75 hover:opacity-100",
                )}
              >
                <LazyImage src={img.src} alt="" className="h-full w-full" />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col" role="dialog" aria-modal="true" aria-label="Fullscreen gallery">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-sm font-medium truncate pr-4">
              {productName} · {active + 1}/{list.length}
            </p>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Close fullscreen"
            >
              <X size={20} />
            </button>
          </div>
          <div
            className="flex-1 relative flex items-center justify-center px-2"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={current.src}
              alt={current.alt || productName}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
            {list.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 text-white flex items-center justify-center"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 text-white flex items-center justify-center"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 py-3 justify-center">
            {list.map((img, i) => (
              <button
                key={`fs-${img.src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "shrink-0 h-14 w-11 rounded-md overflow-hidden border-2",
                  i === active ? "border-[#E8621A]" : "border-transparent opacity-60",
                )}
              >
                <img src={img.src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
