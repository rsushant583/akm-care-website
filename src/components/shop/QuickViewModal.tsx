import { Link, useNavigate } from "react-router-dom";
import { X, ShoppingCart, Zap, Heart } from "lucide-react";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import {
  getProductDisplayTitle,
  getProductMetaLine,
  getProductShortCopy,
} from "@/lib/ecommerce/productPresentation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export function QuickViewModal({
  product,
  onClose,
}: {
  product: CatalogProduct | null;
  onClose: () => void;
}) {
  const { addToCart, buyNowLine } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();

  if (!product) return null;

  const price = getEffectivePrice(product);
  const displayTitle = getProductDisplayTitle(product);
  const shortCopy = getProductShortCopy(product);
  const meta = getProductMetaLine(product);
  const image = product.images[0]?.src || product.image_url || "/placeholder.svg";
  const inStock = product.stock_quantity > 0;

  return (
    <div
      className="fixed inset-0 z-[120] bg-foreground/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view ${displayTitle}`}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-black/[0.06]">
          <h3 className="font-heading text-lg">Quick View</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 rounded-full border border-black/10 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="aspect-[3/4] bg-[#F5F0EB]">
            <img src={image} alt={displayTitle} className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wide">{product.categoryLabel}</p>
              <h4 className="font-heading text-2xl text-[#1A1A1A] mt-1">{displayTitle}</h4>
              {meta ? <p className="type-meta mt-1">{meta}</p> : null}
              <p className="text-sm text-[#6B6B6B] mt-2">{shortCopy}</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[#E8621A]">{formatINR(price)}</span>
              {product.mrp > price && (
                <span className="text-base text-[#6B6B6B] line-through">{formatINR(product.mrp)}</span>
              )}
              {product.discountPercent > 0 && (
                <span className="text-xs font-bold text-emerald-700">{product.discountPercent}% off</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!inStock}
                onClick={() => addToCart({ product })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#E8621A] text-white text-sm font-semibold disabled:opacity-50"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
              <button
                type="button"
                disabled={!inStock}
                onClick={() => {
                  buyNowLine({ product });
                  onClose();
                  navigate("/checkout");
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold disabled:opacity-50"
              >
                <Zap size={16} /> Buy Now
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id, displayTitle)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-black/10 text-sm font-semibold"
              >
                <Heart size={16} fill={isWishlisted(product.id) ? "currentColor" : "none"} className="text-[#E8621A]" />
                Wishlist
              </button>
            </div>
            <Link
              to={productPath(product.slug)}
              onClick={onClose}
              className="inline-block text-sm font-semibold text-[#E8621A] hover:underline"
            >
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
