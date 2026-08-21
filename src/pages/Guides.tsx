import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PAGE_SEO } from "@/data/seoPages";
import { GUIDES } from "@/data/guides";
import { breadcrumbSchema } from "@/lib/schemas";
import { ShopBreadcrumbs } from "@/components/shop";
import { shopCategoryPath } from "@/data/catalog/categories";

const meta = PAGE_SEO["/guides"];
const crumbs = [
  { name: "Home", url: "/" },
  { name: "Guides", url: "/guides" },
];

export default function Guides() {
  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.path}
        schema={breadcrumbSchema(crumbs)}
      />
      <section className="section-padding bg-[#FAF8F5]">
        <div className="container-premium max-w-3xl">
          <ShopBreadcrumbs items={crumbs} className="mb-6" />
          <h1 className="font-heading text-4xl sm:text-5xl text-[#1A1A1A] mb-4">Guides</h1>
          <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed mb-2">
            Short, factual help for shopping on AKM Care. Topics are based on catalog fields and store
            policy — not invented marketing claims.
          </p>
          <p className="text-sm text-[#6B6B6B]">
            Browse products in the{" "}
            <Link to="/shop" className="text-[#E8621A] font-semibold hover:underline">
              shop
            </Link>
            , or see{" "}
            <Link to="/shipping-returns" className="text-[#E8621A] font-semibold hover:underline">
              shipping and returns
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium max-w-3xl space-y-4">
          {GUIDES.map((guide) => (
            <article
              key={guide.slug}
              className="rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-5 sm:p-6"
            >
              <h2 className="font-heading text-xl sm:text-2xl text-[#1A1A1A] mb-2">
                <Link to={guide.path} className="hover:text-[#E8621A] transition-colors">
                  {guide.title}
                </Link>
              </h2>
              <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed mb-3">{guide.summary}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link to={guide.path} className="text-[#E8621A] font-semibold hover:underline">
                  Read guide
                </Link>
                {guide.relatedCategory ? (
                  <Link
                    to={shopCategoryPath(guide.relatedCategory)}
                    className="text-[#6B6B6B] hover:text-[#E8621A] hover:underline"
                  >
                    Shop related category
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
