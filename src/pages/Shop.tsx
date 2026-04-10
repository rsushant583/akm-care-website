import { ShoppingCart, Bell } from "lucide-react";
import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { submitProductInterest } from "@/lib/submissions";
import { SEO } from "@/components/SEO";

export default function Shop() {
  const [showNotify, setShowNotify] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const { data: products, loading } = useProducts();

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitProductInterest({
      name,
      email,
      product_name: selectedProduct || "General product update",
    });
    if (!result.success) {
      toast.error("Could not save your interest right now.");
      return;
    }
    toast.success("Thank you! We will notify you when available.");
    setShowNotify(false);
    setEmail("");
    setName("");
    setSelectedProduct("");
  };

  return (
    <>
      <SEO
        title="Shop — Authentic Village Products | Makhana, Sattu & More"
        description="Buy authentic rural Indian products online — premium Makhana (Fox Nuts), Sattu Powder, and more village produce. Sourced directly from Bihar villages, delivered pan-India."
        keywords="buy makhana online, sattu powder online, village products India, rural products buy, authentic makhana, Bihar products online, healthy snacks India"
        canonical="/shop"
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Authentic Village Products</h1>
          <p className="text-lg text-muted-foreground">
            We're preparing something special. Products will be available soon.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {products.map((product) => (
              <div key={product.id} className="bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover hover:-translate-y-1.5 transition-all duration-200">
                <div className="aspect-square bg-gradient-to-br from-saffron-light to-accent flex items-center justify-center relative">
                  <span className="text-5xl">
                    {product.name.includes("Makhana") ? "🫘" : product.name.includes("Sattu") ? "🌾" : product.name.includes("Honey") ? "🍯" : product.name.includes("Ghee") ? "🧈" : "🫘"}
                  </span>
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${product.status === "sold_out" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {product.status === "sold_out" ? "Sold Out" : "Coming Soon"}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-base mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{product.quantity}</p>
                  <p className="text-xs text-muted-foreground mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xl">₹{product.price}</span>
                    <button disabled className="p-2.5 rounded-xl bg-muted text-muted-foreground cursor-not-allowed">
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProduct(product.name);
                      setShowNotify(true);
                    }}
                    className="mt-3 w-full py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
                  >
                    Notify me when available
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => setShowNotify(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
            >
              <Bell size={18} /> Notify Me When Available
            </button>
          </div>
        </div>
      </section>

      {showNotify && (
        <div className="fixed inset-0 z-[100] bg-foreground/50 flex items-center justify-center p-4" onClick={() => setShowNotify(false)}>
          <div className="bg-card rounded-2xl p-8 max-w-md w-full card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-2xl mb-2">Get Notified</h3>
            <p className="text-muted-foreground mb-6">Enter your email and we'll let you know when products are available.</p>
            <form onSubmit={handleNotify} className="space-y-4">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="text" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} placeholder="Product name" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button type="submit" className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all">
                Notify Me
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
