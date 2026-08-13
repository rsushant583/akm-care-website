import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  Heart,
  ShoppingCart,
  Star,
  Zap,
  GitCompare,
  Share2,
  Bell,
} from "lucide-react";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { shareProduct } from "@/lib/ecommerce/share";
import { getAvailableQuantity, isProductInStock } from "@/lib/ecommerce/availability";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { cn } from "@/lib/utils";

const FALLBACK_IMG = "/placeholder.svg";

export function ProductCard({
  product,
  onQuickView,
  view = "grid",
}: {
  product: CatalogProduct;
  onQuickView?: (product: CatalogProduct) => void;
  view?: "grid" | "list";
}) {
  const navigate = useNavigate();
  const { addToCart, buyNowLine } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const price = getEffectivePrice(product);
  const stockQty = getAvailableQuantity(product);
  const inStock = isProductInStock(product);
  const wished = isWishlisted(product.id);
  const compared = isCompared(product.id);
  const href = productPath(product.slug);
  const primaryRaw = product.images[0]?.src || product.image_url || FALLBACK_IMG;
  const primary = imgFailed ? FALLBACK_IMG : primaryRaw;
  const secondary = product.images[1]?.src || primary;
  const showSwap = hovered && secondary !== primary && !imgFailed;
  const showRating = (product.reviewCount ?? 0) > 0 && product.rating != null;
  const savings = Math.max(0, product.mrp - price);

  const goNotify = () => {
    navigate(`/shop?interest=${encodeURIComponent(product.name)}`);
  };

  if (view === "list") {
    return (
      <article className="group flex gap-4 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-black/[0.06] bg-white shadow-sm hover:shadow-md transition-all duration-300">
        <Link
          to={href}
          className="relative shrink-0 w-28 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden bg-[#F5F0EB]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/[0.04]" aria-hidden />}
          <img
            src={showSwap ? secondary : primary}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgFailed(true);
              setImgLoaded(true);
            }}
            className={cn(
              "h-full w-full object-cover object-top transition-opacity duration-300",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
          />
          {product.discountPercent > 0 && (
            <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E8621A] text-white">
              {product.discountPercent}% OFF
            </span>
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col">
          <Link to={href} className="font-heading text-base sm:text-lg text-[#1A1A1A] hover:text-[#E8621A] line-clamp-2">
            {product.name}
          </Link>
          {showRating && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-[#6B6B6B]">
              <Star size={12} className="text-amber-500 fill-amber-500" aria-hidden />
              <span>
                {product.rating!.toFixed(1)}
                <span className="text-[#6B6B6B]/70"> ({product.reviewCount})</span>
              </span>
            </div>
          )}
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold text-xl text-[#E8621A]">{formatINR(price)}</span>
            {product.mrp > price && (
              <>
                <span className="text-sm text-[#6B6B6B] line-through">{formatINR(product.mrp)}</span>
                <span className="text-xs font-semibold text-emerald-700">{product.discountPercent}% OFF</span>
              </>
            )}
          </div>
          {savings > 0 && (
            <p className="text-[11px] font-medium text-emerald-700 mt-0.5">You save {formatINR(savings)}</p>
          )}
          <p className={cn("text-[11px] mt-1 font-medium", inStock ? "text-emerald-700" : "text-destructive")}>
            {inStock ? `In stock (${stockQty})` : "Out of stock"}
          </p>
          <div className="mt-auto pt-3 flex flex-wrap gap-2">
            {inStock ? (
              <>
                <button
                  type="button"
                  onClick={() => addToCart({ product })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#E8621A] text-white text-xs font-semibold"
                >
                  <ShoppingCart size={14} aria-hidden /> Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    buyNowLine({ product });
                    navigate("/checkout");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold"
                >
                  <Zap size={14} aria-hidden /> Buy Now
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={goNotify}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#E8621A]/40 text-[#E8621A] text-xs font-semibold"
              >
                <Bell size={14} aria-hidden /> Notify Me
              </button>
            )}
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-black/10 text-xs font-semibold"
              >
                <Eye size={14} aria-hidden /> Quick View
              </button>
            )}
            <IconBtn
              label={wished ? "Remove wishlist" : "Add to wishlist"}
              active={wished}
              onClick={() => toggleWishlist(product.id, product.name)}
            >
              <Heart size={14} fill={wished ? "currentColor" : "none"} />
            </IconBtn>
            <IconBtn label="Compare" active={compared} onClick={() => toggleCompare(product)}>
              <GitCompare size={14} />
            </IconBtn>
            <IconBtn label="Share" onClick={() => void shareProduct({ name: product.name, slug: product.slug })}>
              <Share2 size={14} />
            </IconBtn>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white overflow-hidden ring-1 ring-black/[0.06] hover:ring-black/[0.1] transition-[box-shadow,ring-color] duration-300 flex flex-col h-full">
      <div
        className="relative aspect-[3/4] bg-[#F5F0EB] overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link to={href} className="block h-full w-full" aria-label={product.name}>
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/[0.04]" aria-hidden />}
          <img
            src={primary}
            alt={product.name}
            width={480}
            height={640}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgFailed(true);
              setImgLoaded(true);
            }}
            className={cn(
              "absolute inset-0 h-full w-full object-cover object-top transition-all duration-500",
              imgLoaded ? "opacity-100" : "opacity-0",
              showSwap ? "opacity-0 scale-105" : "group-hover:scale-[1.02]",
            )}
          />
          {showSwap && (
            <img
              src={secondary}
              alt=""
              width={480}
              height={640}
              loading="lazy"
              decoding="async"
              aria-hidden
              className={cn(
                "absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500",
                showSwap ? "opacity-100" : "opacity-0",
              )}
            />
          )}
        </Link>

        {product.discountPercent > 0 && (
          <span className="absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded-md bg-[#E8621A] text-white shadow-sm z-[1]">
            {product.discountPercent}% OFF
          </span>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-[1]">
          <IconBtn
            label={wished ? "Remove wishlist" : "Add to wishlist"}
            active={wished}
            onClick={() => toggleWishlist(product.id, product.name)}
            className="bg-white/95"
          >
            <Heart size={15} fill={wished ? "currentColor" : "none"} />
          </IconBtn>
          <IconBtn label="Compare" active={compared} onClick={() => toggleCompare(product)} className="bg-white/95">
            <GitCompare size={15} />
          </IconBtn>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2 translate-y-[110%] group-hover:translate-y-0 transition-transform duration-300 flex gap-1.5 z-[1]">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-white/95 text-xs font-semibold border border-black/10 shadow-sm"
            >
              <Eye size={14} aria-hidden /> Quick View
            </button>
          )}
          {inStock ? (
            <button
              type="button"
              onClick={() => addToCart({ product })}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold shadow-sm"
            >
              <ShoppingCart size={14} aria-hidden /> Cart
            </button>
          ) : (
            <button
              type="button"
              onClick={goNotify}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-white/95 text-[#E8621A] text-xs font-semibold border border-[#E8621A]/30 shadow-sm"
            >
              <Bell size={14} aria-hidden /> Notify
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-3.5 flex flex-col flex-1 min-h-[10.5rem]">
        <Link to={href} className="type-product line-clamp-2 hover:text-[#E8621A] min-h-[2.5rem]">
          {product.name}
        </Link>

        {showRating && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-[#6B6B6B]">
            <Star size={12} className="text-amber-500 fill-amber-500" aria-hidden />
            <span>
              {product.rating!.toFixed(1)}
              <span className="text-[#6B6B6B]/70"> ({product.reviewCount})</span>
            </span>
          </div>
        )}

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="type-price">{formatINR(price)}</span>
          {product.mrp > price && (
            <span className="text-sm text-[#6B6B6B] line-through tabular-nums">{formatINR(product.mrp)}</span>
          )}
        </div>
        {product.discountPercent > 0 && (
          <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
            {product.discountPercent}% OFF · Save {formatINR(savings)}
          </p>
        )}

        <p className={cn("mt-1 text-[11px] font-medium", inStock ? "text-emerald-700" : "text-destructive")}>
          {inStock ? `In stock (${stockQty})` : "Out of stock"}
        </p>

        <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
          {inStock ? (
            <>
              <button
                type="button"
                onClick={() => addToCart({ product })}
                className="h-10 rounded-full text-xs font-semibold border border-[#E8621A]/35 text-[#E8621A] hover:bg-[#E8621A]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  buyNowLine({ product });
                  navigate("/checkout");
                }}
                className="h-10 inline-flex items-center justify-center gap-1 rounded-full text-xs font-semibold bg-[#E8621A] text-white hover:brightness-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
              >
                <Zap size={12} aria-hidden /> Buy Now
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={goNotify}
              className="col-span-2 h-10 inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold border border-[#E8621A]/40 text-[#E8621A] hover:bg-[#E8621A]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
            >
              <Bell size={12} aria-hidden /> Notify me when available
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
  className,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-full border border-black/10 flex items-center justify-center text-[#6B6B6B] hover:text-[#E8621A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
        active && "text-[#E8621A] border-[#E8621A]/30 bg-[#E8621A]/5",
        className,
      )}
    >
      {children}
    </button>
  );
}
