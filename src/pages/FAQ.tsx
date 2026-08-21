import { useState } from "react";
import { Link } from "react-router-dom";
import { useFAQ } from "@/hooks/useFAQ";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema, faqSchema } from "@/lib/schemas";
import { PAGE_SEO } from "@/data/seoPages";
import { ShopBreadcrumbs } from "@/components/shop";

const categories = ["All", "General", "Training", "Services", "Products"];
const meta = PAGE_SEO["/faq"];
const crumbs = [
  { name: "Home", url: "/" },
  { name: "FAQ", url: "/faq" },
];

export default function FAQ() {
  const [filter, setFilter] = useState("All");
  const { data: faqs, loading } = useFAQ();
  const filtered =
    filter === "All"
      ? faqs
      : faqs.filter((f) => String(f.category).toLowerCase() === filter.toLowerCase());
  const schemaFaqs = faqs.slice(0, 20).map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.path}
        schema={[breadcrumbSchema(crumbs), faqSchema(schemaFaqs)].filter(Boolean)}
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <ShopBreadcrumbs items={crumbs} className="mb-6 justify-center" />
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Answers about shopping, shipping, training and services. For delivery windows see{" "}
            <Link to="/shipping-returns" className="text-[#E8621A] font-semibold hover:underline">
              shipping and returns
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium max-w-3xl">
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8" role="tablist" aria-label="FAQ categories">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40 ${filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((faq) => (
                <details key={faq.id} className="bg-card rounded-2xl card-shadow overflow-hidden">
                  <summary className="w-full flex items-center justify-between p-5 text-left cursor-pointer font-heading text-base sm:text-lg list-none [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8621A]/30">
                    <span className="pr-4">{faq.question}</span>
                    <span className="text-muted-foreground shrink-0 text-sm">Show</span>
                  </summary>
                  <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
