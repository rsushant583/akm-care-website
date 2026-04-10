import { Link } from "react-router-dom";

export default function CTABanner() {
  return (
    <section className="section-padding bg-primary">
      <div className="container-premium text-center">
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-primary-foreground mb-4">
          Ready to Transform Your Business?
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
          Partner with AKM Care & AKM Freight for end-to-end industrial excellence
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center px-8 py-4 rounded-full bg-card text-primary font-semibold text-base hover:scale-[1.02] transition-all"
        >
          Contact Us Today
        </Link>
      </div>
    </section>
  );
}
