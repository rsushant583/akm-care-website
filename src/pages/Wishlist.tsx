import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Zap } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getProductById } from "@/services/productService";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { formatINR, getEffectivePrice } from "@/lib/ecommerce/pricing";
import { productPath } from "@/lib/ecommerce/slug";
import { isProductInStock } from "@/lib/ecommerce/availability";
import { EmptyState, ShopBreadcrumbs } from "@/components/shop";
import { shopBreadcrumbs } from "@/lib/ecommerce/seo";

export default function WishlistPage() {
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

  const crumbs = shopBreadcrumbs([{ name: "Wishlist", url: "/wishlist" }]);

  return (
    <>
      <SEO title="Wishlist" description="Your saved AKM Care products." canonical="/wishlist" robots="noindex, follow" />
      <section className="section-padding bg-white pt-6">
        <div className="container-premium">
          <ShopBreadcrumbs items={crumbs} className="mb-6" />
          <h1 className="font-heading text-3xl sm:text-4xl mb-2">Wishlist</h1>
          <p className="text-sm text-[#6B6B6B] mb-8">{count} saved item{count === 1 ? "" : "s"}</p>

          {loading ? (
            <p className="text-sm text-[#6B6B6B]">Loading wishlist…</p>
          ) : products.length === 0 ? (
            <EmptyState
              title="Your wishlist is empty"
              description="Tap the heart on any product to save it here."
              actionLabel="Continue Shopping"
              actionHref="/shop"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => {
                const inStock = isProductInStock(p);
                const price = getEffectivePrice(p);
                return (
                <article key={p.id} className="overflow-hidden bg-[#FAF8F5] ring-1 ring-black/[0.06]">
                  <Link to={productPath(p.slug)} className="block aspect-[3/4] bg-white">
                    <img src={p.image_url || p.images[0]?.src || "/placeholder.svg"} alt={p.name} className="h-full w-full object-cover object-top" loading="lazy" />
                  </Link>
                  <div className="p-4">
                    <Link to={productPath(p.slug)} className="font-heading text-lg hover:text-[#E8621A] line-clamp-2">
                      {p.name}
                    </Link>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="font-semibold text-[#E8621A]">{formatINR(price)}</p>
                      {p.mrp > price && (
                        <p className="text-sm text-[#6B6B6B] line-through">{formatINR(p.mrp)}</p>
                      )}
                    </div>
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
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold px-3 py-2 disabled:opacity-50 min-h-11"
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
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#E8621A] text-white text-xs font-semibold px-3 py-2 disabled:opacity-50 min-h-11"
                      >
                        <Zap size={14} aria-hidden /> Buy Now
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-black/10 text-xs font-semibold px-3 py-2 min-h-11"
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

          <p className="mt-8 text-sm text-[#6B6B6B] inline-flex items-center gap-2">
            <Heart size={14} className="text-[#E8621A]" /> Synced to your account when signed in.
          </p>
        </div>
      </section>
    </>
  );
}
