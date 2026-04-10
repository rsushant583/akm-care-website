import { ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

export default function EcommercePreview() {
  const { ref, isVisible } = useScrollAnimation();
  const { data: products, loading } = useProducts();

  return (
    <section className="section-padding bg-gradient-to-b from-background to-warm-beige/40">
      <div className="container-premium">
        <div className="text-center mb-14">
          <div className="inline-flex items-center rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-semibold mb-4">
            Village Store
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-4">
            From the Heart of India's Villages
          </h2>
          <p className="text-muted-foreground text-lg">
            Authentic rural products, coming to your doorstep
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          )) : products.map((product, i) => (
            <div
              key={product.id}
              className={`group bg-card border border-border/60 rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover hover:-translate-y-1.5 hover:border-primary/30 transition-all duration-200 ${
                isVisible ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="aspect-square bg-gradient-to-br from-saffron-light to-accent flex items-center justify-center relative">
                <span className="text-4xl">
                  {product.name.includes("Makhana") ? "🫘" :
                   product.name.includes("Sattu") ? "🌾" :
                   product.name.includes("Honey") ? "🍯" :
                   product.name.includes("Ghee") ? "🧈" : "🫘"}
                </span>
                <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${
                  product.status === "sold_out"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {product.status === "sold_out" ? "Sold Out" : "Coming Soon"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-heading text-base mb-0.5">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{product.quantity}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">₹{product.price}</span>
                  <button
                    disabled
                    className="p-2 rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
                <button className="mt-3 w-full py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
                  Notify me when available
                </button>
              </div>
            </div>
          ))}
        </div>
        {!loading && products.length === 0 && (
          <div className="text-center mt-8 text-muted-foreground">Products are being updated. Please check again shortly.</div>
        )}
      </div>
    </section>
  );
}
