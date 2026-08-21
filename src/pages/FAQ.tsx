import { useState } from "react";
import { Link } from "react-router-dom";
import { useFAQ } from "@/hooks/useFAQ";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema, faqSchema } from "@/lib/schemas";
import { PAGE_SEO } from "@/data/seoPages";
import { ShopBreadcrumbs } from "@/components/shop";
import { BRAND } from "@/lib/config/brand";
import { SHIPPING_POLICY } from "@/lib/ecommerce/shippingPolicy";

const categories = ["All", "General", "Training", "Services", "Products"];
const meta = PAGE_SEO["/faq"];
const crumbs = [
  { name: "Home", url: "/" },
  { name: "FAQ", url: "/faq" },
];

/** Always-visible storefront facts (not CMS). Kept short and factual for GEO. */
const STOREFRONT_FAQS = [
  {
    question: `Who is ${BRAND.name}?`,
    answer: BRAND.description,
  },
  {
    question: `Where can I buy ${BRAND.name} products?`,
    answer: `On the official website https://www.akmcare.in/shop. Product pages show live price and stock. Categories include sarees, lehengas, gowns, 3-piece suits and men's jeans.`,
  },
  {
    question: "How long does delivery take?",
    answer: `Orders ship ${SHIPPING_POLICY.area}. Store standard is typically ${SHIPPING_POLICY.standardWindow}; express is typically ${SHIPPING_POLICY.expressWindow}. Some products show a catalog-specific window. Checkout confirms the date. See /shipping-returns.`,
  },
  {
    question: "Can I return a product?",
    answer: `${SHIPPING_POLICY.returnSummary}. Arrange returns via support (${BRAND.email} / ${BRAND.phoneDisplay}). Full policy: /shipping-returns.`,
  },
  {
    question: "How do I read saree length on this site?",
    answer:
      "Length comes from the product catalog (often labelled Mtrs APX). Open the product page for that SKU. Guide: /guides/saree-length.",
  },
  {
    question: `How do I contact ${BRAND.name}?`,
    answer: `Email ${BRAND.email}, call ${BRAND.phoneDisplay}, or use WhatsApp. Location: ${BRAND.addressDisplay}. Contact page: /contact.`,
  },
];

export default function FAQ() {
  const [filter, setFilter] = useState("All");
  const { data: faqs, loading } = useFAQ();
  const filtered =
    filter === "All"
      ? faqs
      : faqs.filter((f) => String(f.category).toLowerCase() === filter.toLowerCase());
  const schemaFaqs = [
    ...STOREFRONT_FAQS,
    ...faqs.slice(0, 14).map((f) => ({ question: f.question, answer: f.answer })),
  ].slice(0, 20);

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
            . Shopping help:{" "}
            <Link to="/guides" className="text-[#E8621A] font-semibold hover:underline">
              guides
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="section-padding bg-white border-b border-black/[0.04]">
        <div className="container-premium max-w-3xl">
          <h2 className="font-heading text-2xl mb-4 text-[#1A1A1A]">Store &amp; shipping</h2>
          <div className="space-y-3">
            {STOREFRONT_FAQS.map((faq) => (
              <details key={faq.question} className="bg-[#FAF8F5] rounded-2xl border border-black/[0.06] overflow-hidden">
                <summary className="w-full flex items-center justify-between p-5 text-left cursor-pointer font-heading text-base sm:text-lg list-none [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8621A]/30">
                  <span className="pr-4">{faq.question}</span>
                  <span className="text-muted-foreground shrink-0 text-sm">Show</span>
                </summary>
                <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium max-w-3xl">
          <h2 className="font-heading text-2xl mb-4 text-[#1A1A1A]">More questions</h2>
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
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No extra questions in this category yet.</p>
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
