import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Heart, ShoppingCart, Star, Zap } from "lucide-react";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice, displayDiscountPercent } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { isProductInStock } from "@/lib/ecommerce/availability";
import { getProductBadges, getStockLabel } from "@/lib/ecommerce/badges";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ProductBadgeStack } from "./ProductBadge";
import { cn } from "@/lib/utils";
import { getProductImgProps, PRODUCT_IMAGE_FALLBACK, resolveProductImageSrc } from "@/lib/images/productImage";

const FALLBACK_IMG = PRODUCT_IMAGE_FALLBACK;

export function ProductCard({
  product,
  onQuickView,
  view = "grid",
  priority = false,
  compact = false,
}: {
  product: CatalogProduct;
  onQuickView?: (product: CatalogProduct) => void;
  view?: "grid" | "list";
  priority?: boolean;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { addToCart, buyNowLine } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const price = getEffectivePrice(product);
  const inStock = isProductInStock(product);
  const wished = isWishlisted(product.id);
  const href = productPath(product.slug);
  const primaryRaw = product.images[0]?.src || product.image_url || FALLBACK_IMG;
  const primaryImg = getProductImgProps({
    src: primaryRaw,
    productName: product.name,
    alt: product.images[0]?.alt,
    role: view === "list" ? "cardList" : "card",
    priority,
  });
  const primary = imgFailed ? FALLBACK_IMG : primaryImg.src;
  const secondary = resolveProductImageSrc(product.images[1]?.src || primary);
  const showSwap = hovered && secondary !== primary && !imgFailed;
  const showRating = (product.reviewCount ?? 0) > 0 && product.rating != null;
  const savings = Math.max(0, product.mrp - price);
  const discountOff = displayDiscountPercent(product.discountPercent);
  const badges = getProductBadges(product, 2);
  const stock = getStockLabel(product);
  const meta = product.categoryLabel || product.productCode;

  const goNotify = () => {
    navigate(`/shop?interest=${encodeURIComponent(product.name)}`);
  };

  const buyNow = () => {
    buyNowLine({ product });
    navigate("/checkout");
  };

  const handleAdd = () => {
    if (!inStock || adding) return;
    setAdding(true);
    addToCart({ product });
    setJustAdded(true);
    window.setTimeout(() => setAdding(false), 450);
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  if (view === "list") {
    return (
      <article className="group flex gap-4 sm:gap-5 p-3 sm:p-4 border border-black/[0.06] bg-white">
        <Link
          to={href}
          className="relative shrink-0 w-28 sm:w-36 aspect-[3/4] overflow-hidden bg-[#F5F0EB]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/[0.04]" aria-hidden />}
          <img
            src={showSwap ? secondary : primary}
            alt={primaryImg.alt || product.name}
            width={primaryImg.width}
            height={primaryImg.height}
            loading={primaryImg.loading}
            decoding={primaryImg.decoding}
            fetchPriority={primaryImg.fetchPriority}
            srcSet={!showSwap && !imgFailed ? primaryImg.srcSet : undefined}
            sizes={!showSwap && !imgFailed ? primaryImg.sizes : undefined}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgFailed(true);
              setImgLoaded(true);
            }}
            className={cn(
              "h-full w-full product-photo transition-opacity duration-300",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
          />
          <ProductBadgeStack badges={badges.slice(0, 1)} />
        </Link>

        <div className="flex-1 min-w-0 flex flex-col">
          <Link to={href} className="font-heading text-base sm:text-lg text-[#1A1A1A] hover:text-[#E8621A] line-clamp-2">
            {product.name}
          </Link>
          {meta ? <p className="type-meta mt-1">{meta}</p> : null}
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
                {discountOff > 0 && (
                  <span className="text-xs font-semibold text-emerald-700">{discountOff}% OFF</span>
                )}
              </>
            )}
          </div>
          {savings > 0 && (
            <p className="text-[11px] font-medium text-emerald-700 mt-0.5">You save {formatINR(savings)}</p>
          )}
          {stock && (
            <p className={cn("text-[11px] mt-1 font-medium", stock.tone === "out" ? "text-destructive" : "text-amber-800")}>
              {stock.text}
            </p>
          )}
          <div className="mt-auto pt-3 flex flex-wrap gap-2">
            {inStock ? (
              <>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold disabled:opacity-60"
                >
                  <ShoppingCart size={14} aria-hidden /> {justAdded ? "Added" : adding ? "Adding…" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={adding}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-full bg-[#E8621A] text-white text-xs font-semibold disabled:opacity-60"
                >
                  <Zap size={14} aria-hidden /> Buy Now
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={goNotify}
                className="inline-flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-full border border-[#E8621A]/40 text-[#E8621A] text-xs font-semibold"
              >
                <Bell size={14} aria-hidden /> Notify Me
              </button>
            )}
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="inline-flex items-center min-h-11 px-3 py-2 rounded-full border border-black/10 text-xs font-semibold"
              >
                Quick View
              </button>
            )}
            <IconBtn
              label={wished ? "Remove from wishlist" : "Add to wishlist"}
              active={wished}
              onClick={() => toggleWishlist(product.id, product.name)}
            >
              <Heart size={14} fill={wished ? "currentColor" : "none"} />
            </IconBtn>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white overflow-hidden ring-1 ring-black/[0.06] hover:ring-black/[0.12] motion-safe:transition-[box-shadow,ring-color] duration-300 flex flex-col h-full">
      <div
        className="relative aspect-[3/4] bg-[#F5F0EB] overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link to={href} className="block h-full w-full" aria-label={product.name}>
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/[0.04]" aria-hidden />}
          <img
            src={primary}
            alt={primaryImg.alt || product.name}
            width={primaryImg.width}
            height={primaryImg.height}
            loading={primaryImg.loading}
            fetchPriority={primaryImg.fetchPriority}
            decoding={primaryImg.decoding}
            srcSet={!imgFailed ? primaryImg.srcSet : undefined}
            sizes={!imgFailed ? primaryImg.sizes : undefined}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgFailed(true);
              setImgLoaded(true);
            }}
            className={cn(
              "absolute inset-0 h-full w-full product-photo transition-opacity duration-300",
              imgLoaded && !showSwap ? "opacity-100" : "opacity-0",
            )}
          />
          {showSwap && (
            <img
              src={secondary}
              alt=""
              width={primaryImg.width}
              height={primaryImg.height}
              loading="lazy"
              decoding="async"
              aria-hidden
              className="absolute inset-0 h-full w-full product-photo"
            />
          )}
        </Link>

        <ProductBadgeStack badges={badges} />

        <div className="absolute bottom-2.5 right-2.5 z-[1]">
          <IconBtn
            label={wished ? "Remove from wishlist" : "Add to wishlist"}
            active={wished}
            onClick={() => toggleWishlist(product.id, product.name)}
            className="bg-white shadow-sm"
          >
            <Heart size={15} fill={wished ? "currentColor" : "none"} />
          </IconBtn>
        </div>
      </div>

      <div className={cn("px-2.5 py-2.5 sm:px-3 sm:py-3 flex flex-col flex-1", compact ? "min-h-0" : "")}>
        <Link to={href} className="type-product line-clamp-2 min-h-[2.5rem] hover:text-[#E8621A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40">
          {product.name}
        </Link>
        {!compact && meta ? <p className="type-meta mt-1 line-clamp-1">{meta}</p> : null}

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
          <span className="type-price text-base sm:text-lg">{formatINR(price)}</span>
          {product.mrp > price && (
            <span className="text-xs sm:text-sm text-[#6B6B6B] line-through tabular-nums">{formatINR(product.mrp)}</span>
          )}
        </div>
        {discountOff > 0 && savings > 0 && (
          <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
            {discountOff}% OFF · Save {formatINR(savings)}
          </p>
        )}
        {stock && (
          <p className={cn("mt-1 text-[11px] font-medium", stock.tone === "out" ? "text-destructive" : "text-amber-800")}>
            {stock.text}
          </p>
        )}

        <div className={cn("mt-auto pt-2.5 grid gap-2", compact ? "grid-cols-1" : "grid-cols-2")}>
          {inStock ? (
            <>
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                className={cn(
                  "h-10 text-xs font-semibold border border-black/15 text-[#1A1A1A] hover:border-[#E8621A]/40 hover:text-[#E8621A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40 disabled:opacity-60",
                  compact && "col-span-1",
                )}
              >
                {justAdded ? "Added" : adding ? "Adding…" : "Add to Cart"}
              </button>
              {!compact && (
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={adding}
                  className="h-10 inline-flex items-center justify-center gap-1 text-xs font-semibold bg-[#E8621A] text-white hover:brightness-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40 disabled:opacity-60"
                >
                  <Zap size={12} aria-hidden /> Buy Now
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={goNotify}
              className="col-span-full h-10 inline-flex items-center justify-center gap-1.5 text-xs font-semibold border border-[#E8621A]/40 text-[#E8621A] hover:bg-[#E8621A]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
            >
              <Bell size={12} aria-hidden /> Notify me
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
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-10 w-10 rounded-full border border-black/10 flex items-center justify-center text-[#6B6B6B] hover:text-[#E8621A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
        active && "text-[#E8621A] border-[#E8621A]/30 bg-[#E8621A]/5",
        className,
      )}
    >
      {children}
    </button>
  );
}
