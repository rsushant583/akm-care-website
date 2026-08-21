import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PAGE_SEO } from "@/data/seoPages";
import { breadcrumbSchema, faqSchema } from "@/lib/schemas";
import { BRAND } from "@/lib/config/brand";
import { DEFAULT_SHIPPING_CONFIG } from "@/lib/ecommerce/shippingSettings";
import { SHIPPING_POLICY } from "@/lib/ecommerce/shippingPolicy";
import { ShopBreadcrumbs } from "@/components/shop";

const meta = PAGE_SEO["/shipping-returns"];

const crumbs = [
  { name: "Home", url: "/" },
  { name: "Shop", url: "/shop" },
  { name: "Shipping & Returns", url: "/shipping-returns" },
];

const faqs = [
  {
    question: "Where does AKM Care deliver?",
    answer: "Orders are delivered pan-India. Enter a 6-digit pincode on a product page to check whether that pincode is currently serviceable. The final delivery date is confirmed at checkout.",
  },
  {
    question: "How long does delivery take?",
    answer: `Standard delivery is typically ${SHIPPING_POLICY.standardWindow}. Express delivery is typically ${SHIPPING_POLICY.expressWindow}. Some catalog items list a product-specific shipping window on the product page — that figure is used when present.`,
  },
  {
    question: "How much is shipping?",
    answer: `Current store defaults are ₹${DEFAULT_SHIPPING_CONFIG.standard} for standard delivery and ₹${DEFAULT_SHIPPING_CONFIG.express} for express, with free shipping on orders above ₹${DEFAULT_SHIPPING_CONFIG.freeAbove}. Charges can be updated in store settings; the amount billed is always the figure calculated at secure checkout.`,
  },
  {
    question: "What is the return policy?",
    answer: "Unused products can be returned within 7 days if they are in original packing. Cancellation, returns and refunds are handled by support rather than as a self-serve checkout action.",
  },
  {
    question: "How do I start a return?",
    answer: `Email ${BRAND.email} or call ${BRAND.phoneDisplay} with your order number. Include photos if the item arrived damaged.`,
  },
];

export default function ShippingReturns() {
  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.path}
        schema={[breadcrumbSchema(crumbs), faqSchema(faqs)]}
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium max-w-3xl">
          <ShopBreadcrumbs items={crumbs} className="mb-6 justify-center sm:justify-start" />
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6 text-center sm:text-left">
            Shipping & Returns
          </h1>
          <p className="text-lg text-muted-foreground text-center sm:text-left">
            Delivery, charges and the unused-product return window for AKM Care orders.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium max-w-3xl space-y-10">
          <div>
            <h2 className="font-heading text-2xl mb-4">Pan-India delivery</h2>
            <p className="text-muted-foreground leading-relaxed">
              AKM Care ships fashion products across India. Use the pincode checker on a product page before you order.
              Serviceability can vary by pincode; checkout confirms the delivery estimate for your address.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Delivery windows</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
              <li>Standard delivery: typically {SHIPPING_POLICY.standardWindow}.</li>
              <li>Express delivery: typically {SHIPPING_POLICY.expressWindow}.</li>
              <li>If a product lists its own shipping duration, that catalog value is shown on the product page.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Shipping charges</h2>
            <p className="text-muted-foreground leading-relaxed">
              The store currently uses ₹{DEFAULT_SHIPPING_CONFIG.standard} (standard) and ₹
              {DEFAULT_SHIPPING_CONFIG.express} (express), with free shipping above ₹
              {DEFAULT_SHIPPING_CONFIG.freeAbove}. These amounts are store settings and may change. Razorpay and cash-on-delivery
              totals always use the server-calculated checkout amount — not a guess from this page.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">7-day returns</h2>
            <p className="text-muted-foreground leading-relaxed">
              Unused items may be returned within {SHIPPING_POLICY.returnWindowDays} days in original packing. This matches the return window shown on product
              pages and the shop trust strip. Returns are arranged through support, not as an automatic checkout button.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Questions</h2>
            <div className="space-y-3">
              {faqs.map((item) => (
                <details key={item.question} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <summary className="cursor-pointer font-heading text-base">{item.question}</summary>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Shop the catalog on{" "}
            <Link to="/shop" className="text-[#E8621A] font-semibold hover:underline">
              the AKM Care shop
            </Link>{" "}
            or{" "}
            <Link to="/contact" className="text-[#E8621A] font-semibold hover:underline">
              contact us
            </Link>{" "}
            at {BRAND.email} / {BRAND.phoneDisplay}.
          </p>
        </div>
      </section>
    </>
  );
}
