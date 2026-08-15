import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Zap } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getProductById } from "@/services/productService";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { isProductInStock } from "@/lib/ecommerce/availability";

export default function AccountWishlistPage() {
  const { ids, count, remove } = useWishlist();
  const { addToCart, buyNowLine } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const rows = await Promise.all(ids.map((id) => getProductById(id).catch(() => null)));
      if (!cancelled) {
        setProducts(rows.filter(Boolean) as CatalogProduct[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl">Wishlist</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">
          {count} saved item{count === 1 ? "" : "s"}
          {" · "}
          <Link to="/wishlist" className="font-semibold text-[#E8621A]">
            Open full wishlist page
          </Link>
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3" aria-busy="true" role="status">
          <span className="sr-only">Loading wishlist</span>
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white border animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
          <p className="font-heading text-xl mb-2">
            {count > 0 ? "Saved items are no longer in the catalog" : "Your wishlist is empty"}
          </p>
          <p className="text-sm text-[#6B6B6B] mb-5">
            {count > 0
              ? "Those products are not currently available to purchase."
              : "Tap the heart on any product to save it here."}
          </p>
          <Link
            to="/shop"
            className="inline-flex rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 items-center"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {count > products.length ? (
            <p className="sm:col-span-2 text-sm text-[#6B6B6B]">
              {count - products.length} saved item{count - products.length === 1 ? "" : "s"} no longer appear in the catalog.
            </p>
          ) : null}
          {products.map((p) => {
            const inStock = isProductInStock(p);
            return (
              <article key={p.id} className="rounded-2xl border border-black/[0.06] overflow-hidden bg-white">
                <Link to={productPath(p.slug)} className="block aspect-[3/4] bg-[#FAF8F5]">
                  <img
                    src={p.image_url || p.images[0]?.src || "/placeholder.svg"}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </Link>
                <div className="p-4">
                  <Link to={productPath(p.slug)} className="font-heading text-lg hover:text-[#E8621A] line-clamp-2">
                    {p.name}
                  </Link>
                  <p className="mt-2 font-semibold text-[#E8621A]">{formatINR(getEffectivePrice(p))}</p>
                  {inStock ? (
                    <p className="text-xs font-medium text-emerald-700 mt-1">In stock</p>
                  ) : (
                    <p className="text-xs font-semibold text-red-600 mt-1">Currently unavailable</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() => addToCart({ product: p })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold px-3 py-2.5 min-h-11 disabled:opacity-50"
                    >
                      <ShoppingCart size={14} aria-hidden /> Add to Cart
                    </button>
                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() => {
                        buyNowLine({ product: p });
                        navigate("/checkout");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#E8621A] text-white text-xs font-semibold px-3 py-2.5 min-h-11 disabled:opacity-50"
                    >
                      <Zap size={14} aria-hidden /> Buy Now
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 text-xs font-semibold px-3 py-2.5 min-h-11"
                    >
                      <Trash2 size={14} aria-hidden /> Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
