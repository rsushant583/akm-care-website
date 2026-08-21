import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PAGE_SEO } from "@/data/seoPages";
import { breadcrumbSchema } from "@/lib/schemas";
import { BRAND } from "@/lib/config/brand";
import { ShopBreadcrumbs } from "@/components/shop";

const meta = PAGE_SEO["/privacy"];

const crumbs = [
  { name: "Home", url: "/" },
  { name: "Privacy Policy", url: "/privacy" },
];

export default function Privacy() {
  return (
    <>
      <SEO title={meta.title} description={meta.description} canonical={meta.path} schema={breadcrumbSchema(crumbs)} />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium max-w-3xl">
          <ShopBreadcrumbs items={crumbs} className="mb-6 justify-center sm:justify-start" />
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6 text-center sm:text-left">Privacy Policy</h1>
          <p className="text-muted-foreground text-center sm:text-left">Last updated: 21 August 2026</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium max-w-3xl space-y-10">
          <div>
            <h2 className="font-heading text-2xl mb-4">Who we are</h2>
            <p className="text-muted-foreground leading-relaxed">
              This policy describes how {BRAND.name} ({BRAND.addressDisplay}) handles information submitted through{" "}
              <a href="https://www.akmcare.in" className="text-[#E8621A] font-semibold hover:underline">
                www.akmcare.in
              </a>
              . Questions: {BRAND.email} or {BRAND.phoneDisplay}.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Information we collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
              <li>Account details if you sign in (name, email, and any profile fields you save).</li>
              <li>Order details: products, quantities, delivery address, phone number, and payment status.</li>
              <li>Contact-form, career, vendor and “notify me” submissions you send us.</li>
              <li>Wishlist, saved addresses and cart contents associated with your account or browser session.</li>
              <li>Technical logs needed to run the site (for example, security and error diagnostics). We do not sell customer lists.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              Card and UPI checkout is processed by Razorpay. AKM Care does not store full card numbers on this website.
              Razorpay’s own privacy terms apply to payment credentials.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">How we use information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information you provide to fulfil orders, respond to enquiries, operate training and HR service
              requests, send order-related messages, prevent fraud, and improve the storefront. We do not use invented
              reviews or purchase history from other customers as if it were yours.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We share data with infrastructure providers required to run the site (hosting, authentication, database,
              email delivery, and payment). We may share information if required by Indian law. We do not sell personal
              information.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Retention and your requests</h2>
            <p className="text-muted-foreground leading-relaxed">
              Order records are kept as needed for fulfilment, accounting and dispute handling. To access, correct or
              request deletion of account data, email {BRAND.email}. Some records may be retained where the law requires
              it.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              The site uses cookies and similar storage for sign-in sessions, cart state and optional analytics when
              Google Analytics is enabled in the deployed configuration.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Also read our{" "}
            <Link to="/terms" className="text-[#E8621A] font-semibold hover:underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link to="/disclaimer" className="text-[#E8621A] font-semibold hover:underline">
              Disclaimer
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
