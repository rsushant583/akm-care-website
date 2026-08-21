import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PAGE_SEO } from "@/data/seoPages";
import { getGuide } from "@/data/guides";
import { breadcrumbSchema, faqSchema } from "@/lib/schemas";
import { ShopBreadcrumbs } from "@/components/shop";
import { shopCategoryPath } from "@/data/catalog/categories";
import { BRAND } from "@/lib/config/brand";
import { SHIPPING_POLICY } from "@/lib/ecommerce/shippingPolicy";

const guide = getGuide("saree-length")!;
const meta = PAGE_SEO["/guides/saree-length"];
const crumbs = [
  { name: "Home", url: "/" },
  { name: "Guides", url: "/guides" },
  { name: "Saree length", url: guide.path },
];

const faqs = [
  {
    question: "What does Mtrs APX mean on an AKM Care saree?",
    answer:
      "It is the catalog length for that product, written as metres approximate. The exact string is taken from the product’s dimensions (or size specification) on the product page.",
  },
  {
    question: "Where do I see saree length before buying?",
    answer:
      "Open the product page. Length appears in the product facts and specifications when the catalog has a dimensions value. Lengths differ by SKU.",
  },
  {
    question: "Does length include the blouse piece?",
    answer:
      "Only if the product page or specifications say so. If fabric or blouse length is not listed on that SKU, AKM Care does not invent it here.",
  },
];

export default function GuideSareeLength() {
  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.path}
        schema={[breadcrumbSchema(crumbs), faqSchema(faqs)]}
      />
      <article className="section-padding bg-white">
        <div className="container-premium max-w-3xl">
          <ShopBreadcrumbs items={crumbs} className="mb-6" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-[#1A1A1A] mb-6 leading-tight">
            {guide.title}
          </h1>

          <section className="mb-10">
            <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A] mb-3">Direct answer</h2>
            <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed">
              On {BRAND.name}, saree length is the value stored on that product — usually shown as metres
              approximate (<span className="text-[#1A1A1A] font-medium">Mtrs APX</span>). It is SKU-specific.
              Always read the number on the product page rather than assuming a standard length for every
              saree.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A] mb-3">Explanation</h2>
            <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed mb-4">
              Catalog fields such as dimensions (and sometimes a size specification) are mapped onto the
              product page. Many live sarees use wording like “6 Mtrs APX” or “6.3 Mtrs APX”. The “APX”
              label means approximate metres as entered for that listing. If a product has no length in
              the catalog, the page will not invent one.
            </p>
            <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed">
              Colour, fabric, origin, and blouse piece details appear only when those fields exist for the
              SKU. Price, stock, and shipping on the same page come from the live catalog and store policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A] mb-3">Important facts</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-[#6B6B6B]">
              <li>Length is per product — open the PDP to confirm.</li>
              <li>
                Browse sarees at{" "}
                <Link to={shopCategoryPath("sarees")} className="text-[#E8621A] font-semibold hover:underline">
                  /shop?category=sarees
                </Link>
                .
              </li>
              <li>
                Delivery is {SHIPPING_POLICY.area}; store standard is typically {SHIPPING_POLICY.standardWindow}.
                Checkout confirms the date. Full policy:{" "}
                <Link to="/shipping-returns" className="text-[#E8621A] font-semibold hover:underline">
                  shipping and returns
                </Link>
                .
              </li>
              <li>
                Questions about an order: {BRAND.email} or {BRAND.phoneDisplay}.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A] mb-3">Product context</h2>
            <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed mb-3">
              Use the sarees category to compare lengths that are actually listed on each product. Related
              shopping:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base">
              <li>
                <Link to={shopCategoryPath("sarees")} className="text-[#E8621A] font-semibold hover:underline">
                  All sarees
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-[#E8621A] font-semibold hover:underline">
                  Full shop
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-[#E8621A] font-semibold hover:underline">
                  More guides
                </Link>
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A] mb-4">FAQ</h2>
            <div className="space-y-3">
              {faqs.map((item) => (
                <details
                  key={item.question}
                  className="rounded-2xl border border-black/[0.06] bg-[#FAF8F5] overflow-hidden"
                >
                  <summary className="cursor-pointer p-4 font-heading text-base list-none [&::-webkit-details-marker]:hidden">
                    {item.question}
                  </summary>
                  <p className="px-4 pb-4 text-sm text-[#6B6B6B] leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <p className="text-xs text-[#6B6B6B] border-t border-black/[0.06] pt-4">
            Sources: live product dimensions on {BRAND.name} product pages; store shipping policy module;
            brand contact on /contact. No external length standards are claimed here.
          </p>
        </div>
      </article>
    </>
  );
}
