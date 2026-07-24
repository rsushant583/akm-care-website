import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  Heart,
  ShoppingCart,
  Star,
  Zap,
  GitCompare,
  Share2,
} from "lucide-react";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { shareProduct } from "@/lib/ecommerce/share";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { cn } from "@/lib/utils";

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
  const [hovered, setHovered] = useState(false);

  const price = getEffectivePrice(product);
  const inStock = product.stock_quantity > 0;
  const wished = isWishlisted(product.id);
  const compared = isCompared(product.id);
  const href = productPath(product.slug);
  const primary = product.images[0]?.src || product.image_url || "/placeholder.svg";
  const secondary = product.images[1]?.src || primary;
  const showSwap = hovered && secondary !== primary;

  if (view === "list") {
    return (
      <article className="group flex gap-4 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-black/[0.06] bg-white shadow-sm hover:shadow-md transition-all duration-300">
        <Link
          to={href}
          className="relative shrink-0 w-28 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden bg-[#F5F0EB]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/[0.04]" />}
          <img
            src={showSwap ? secondary : primary}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
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
          <p className="text-[11px] uppercase tracking-wide text-[#6B6B6B]">{product.brand || "AKM Care"}</p>
          <Link to={href} className="font-heading text-base sm:text-lg text-[#1A1A1A] hover:text-[#E8621A] line-clamp-2">
            {product.name}
          </Link>
          <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">{product.shortDescription}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-[#6B6B6B]">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            {(product.rating ?? 4.5).toFixed(1)}
          </div>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="font-semibold text-xl text-[#E8621A]">{formatINR(price)}</span>
            {product.mrp > price && (
              <>
                <span className="text-sm text-[#6B6B6B] line-through">{formatINR(product.mrp)}</span>
                <span className="text-xs font-semibold text-emerald-700">
                  Save {product.discountPercent}%
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-1">
            {inStock ? `In stock (${product.stock_quantity})` : "Out of stock"}
          </p>
          <div className="mt-auto pt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!inStock}
              onClick={() => addToCart({ product })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#E8621A] text-white text-xs font-semibold disabled:opacity-50"
            >
              <ShoppingCart size={14} /> Add to Cart
            </button>
            <button
              type="button"
              disabled={!inStock}
              onClick={() => {
                buyNowLine({ product });
                navigate("/checkout");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold disabled:opacity-50"
            >
              <Zap size={14} /> Buy Now
            </button>
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-black/10 text-xs font-semibold"
              >
                <Eye size={14} /> Quick View
              </button>
            )}
            <IconBtn
              label={wished ? "Remove wishlist" : "Wishlist"}
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
    <article className="group bg-white rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      <div
        className="relative aspect-[3/4] bg-[#F5F0EB] overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link to={href} className="block h-full w-full">
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/[0.04]" />}
          <img
            src={primary}
            alt={product.name}
            width={480}
            height={640}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-all duration-500",
              imgLoaded ? "opacity-100" : "opacity-0",
              showSwap ? "opacity-0 scale-105" : "group-hover:scale-[1.03]",
            )}
          />
          {secondary !== primary && (
            <img
              src={secondary}
              alt=""
              width={480}
              height={640}
              loading="lazy"
              decoding="async"
              aria-hidden
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                showSwap ? "opacity-100" : "opacity-0",
              )}
            />
          )}
        </Link>

        {product.discountPercent > 0 && (
          <span className="absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded-md bg-[#E8621A] text-white shadow-sm">
            {product.discountPercent}% OFF
          </span>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <IconBtn
            label={wished ? "Remove wishlist" : "Wishlist"}
            active={wished}
            onClick={() => toggleWishlist(product.id, product.name)}
            className="bg-white/95"
          >
            <Heart size={15} fill={wished ? "currentColor" : "none"} />
          </IconBtn>
          <IconBtn label="Compare" active={compared} onClick={() => toggleCompare(product)} className="bg-white/95">
            <GitCompare size={15} />
          </IconBtn>
          <IconBtn
            label="Share"
            onClick={() => void shareProduct({ name: product.name, slug: product.slug })}
            className="bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Share2 size={15} />
          </IconBtn>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2 translate-y-[110%] group-hover:translate-y-0 transition-transform duration-300 flex gap-1.5">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-white/95 text-xs font-semibold border border-black/10 shadow-sm"
            >
              <Eye size={14} /> Quick View
            </button>
          )}
          <button
            type="button"
            disabled={!inStock}
            onClick={() => addToCart({ product })}
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold disabled:opacity-50 shadow-sm"
          >
            <ShoppingCart size={14} /> Cart
          </button>
        </div>
      </div>

      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <p className="text-[10px] uppercase tracking-wide text-[#6B6B6B] mb-0.5">{product.brand || "AKM Care"}</p>
        <Link to={href} className="font-heading text-sm sm:text-base text-[#1A1A1A] line-clamp-2 hover:text-[#E8621A]">
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-1 text-xs text-[#6B6B6B]">
          <Star size={12} className="text-amber-500 fill-amber-500" />
          <span>{(product.rating ?? 4.5).toFixed(1)}</span>
        </div>

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-lg text-[#E8621A]">{formatINR(price)}</span>
          {product.mrp > price && (
            <span className="text-sm text-[#6B6B6B] line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        {product.discountPercent > 0 && (
          <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
            Save {product.discountPercent}% ({formatINR(product.mrp - price)})
          </p>
        )}

        <p className="mt-1 text-[11px] text-[#6B6B6B]">
          {inStock ? `In stock (${product.stock_quantity})` : "Out of stock"}
        </p>

        <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!inStock}
            onClick={() => addToCart({ product })}
            className="py-2 rounded-full text-xs font-semibold border border-[#E8621A]/30 text-[#E8621A] disabled:opacity-50 hover:bg-[#E8621A]/5 transition-colors"
          >
            Add to Cart
          </button>
          <button
            type="button"
            disabled={!inStock}
            onClick={() => {
              buyNowLine({ product });
              navigate("/checkout");
            }}
            className="inline-flex items-center justify-center gap-1 py-2 rounded-full text-xs font-semibold bg-[#E8621A] text-white disabled:opacity-50 hover:brightness-105 transition-all"
          >
            <Zap size={12} /> Buy Now
          </button>
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
  children: React.ReactNode;
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
        "h-9 w-9 rounded-full border border-black/10 flex items-center justify-center text-[#6B6B6B] hover:text-[#E8621A] transition-colors",
        active && "text-[#E8621A] border-[#E8621A]/30 bg-[#E8621A]/5",
        className,
      )}
    >
      {children}
    </button>
  );
}
