import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/lib/schemas";
import { ShopBreadcrumbs } from "@/components/shop";

const CONTACT_EMAIL = "contact@akmcare.in";
const CONTACT_PHONE = "+91-84019 95486";

const crumbs = [
  { name: "Home", url: "/" },
  { name: "Terms of Use", url: "/terms" },
];

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Use — AKM Care"
        description="Terms for using www.akmcare.in, including the store catalog, accounts and jurisdiction."
        canonical="/terms"
        schema={breadcrumbSchema(crumbs)}
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium max-w-3xl">
          <ShopBreadcrumbs items={crumbs} className="mb-6 justify-center sm:justify-start" />
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6 text-center sm:text-left">Terms of Use</h1>
          <p className="text-muted-foreground text-center sm:text-left">Last updated: 23 August 2026</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium max-w-3xl space-y-10">
          <div>
            <h2 className="font-heading text-2xl mb-4">Agreement</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using www.akmcare.in you agree to these terms, our{" "}
              <Link to="/privacy" className="text-[#E8621A] font-semibold hover:underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/disclaimer" className="text-[#E8621A] font-semibold hover:underline">
                Disclaimer
              </Link>
              . If you do not agree, do not use the site.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">The store</h2>
            <p className="text-muted-foreground leading-relaxed">
              Product names, prices, stock, images and specifications come from the live catalog. Availability can change
              without notice. An order is accepted when payment is confirmed and stock can be fulfilled. Shipping windows
              and charges are described on{" "}
              <Link to="/shipping-returns" className="text-[#E8621A] font-semibold hover:underline">
                Shipping & Returns
              </Link>{" "}
              and confirmed at checkout.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for keeping your sign-in details confidential and for activity under your account.
              Staff admin tools are restricted to authorised AKM Care users.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Industrial training, HR and compliance engagements are scoped in a separate discussion or agreement with
              AKM Care. Website descriptions are informational and do not replace a signed statement of work.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Acceptable use</h2>
            <p className="text-muted-foreground leading-relaxed">
              Do not misuse the site, attempt unauthorised access, scrape in a way that disrupts service, or submit false
              order or contact information.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Jurisdiction</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of India. In case of any legal dispute, redressal will be in
              Ahmedabad, Gujarat jurisdiction.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Contact {CONTACT_EMAIL} or {CONTACT_PHONE}.
          </p>
        </div>
      </section>
    </>
  );
}
