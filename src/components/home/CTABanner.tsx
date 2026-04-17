import { Link } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";

export default function CTABanner() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(root.querySelectorAll("[data-cta-reveal]"), {
        opacity: 0,
        y: 32,
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="section-padding bg-primary">
      <div className="container-premium text-center">
        <h2 data-cta-reveal className="font-heading text-3xl sm:text-4xl lg:text-5xl text-primary-foreground mb-4">
          Ready to Transform Your Business?
        </h2>
        <p data-cta-reveal className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
          Partner with AKM Care for end-to-end industrial excellence
        </p>
        <Link
          data-cta-reveal
          to="/contact"
          className="inline-flex items-center px-8 py-4 rounded-full bg-card text-primary font-semibold text-base hover:scale-[1.02] transition-all"
        >
          Contact Us Today
        </Link>
      </div>
    </section>
  );
}
