import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFAQ } from "@/hooks/useFAQ";
import { Skeleton } from "@/components/ui/skeleton";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";
import { runRevealWhenVisible } from "@/lib/runRevealWhenVisible";

export default function FAQPreview() {
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { data: faqs, loading } = useFAQ();
  const previewFaqs = faqs.slice(0, 4);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || loading || previewFaqs.length === 0 || prefersReducedMotion()) return;

    let ctx: gsap.Context | null = null;
    const disconnect = runRevealWhenVisible(root, () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.from(root.querySelectorAll("[data-faq-reveal]"), {
          opacity: 0,
          y: 36,
          duration: 0.8,
          stagger: 0.07,
          ease: "power3.out",
        }).from(
          root.querySelectorAll("[data-faq-item]"),
          {
            opacity: 0,
            y: 28,
            duration: 0.65,
            stagger: 0.06,
            ease: "power3.out",
          },
          "-=0.5",
        );
        tl.play(0);
      }, root);
    });

    return () => {
      disconnect();
      ctx?.revert();
    };
  }, [loading, previewFaqs.length]);

  return (
    <section ref={rootRef} className="section-padding bg-gradient-to-b from-warm-beige to-background">
      <div className="container-premium max-w-3xl">
        <div className="text-center">
          <div
            data-faq-reveal
            className="inline-flex items-center rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-semibold mb-4"
          >
            Need Help?
          </div>
        </div>
        <h2 data-faq-reveal className="font-heading text-3xl sm:text-4xl text-center mb-10">
          Common Questions
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : (
        <div className="space-y-3">
          {previewFaqs.map((faq) => (
            <div key={faq.id} data-faq-item className="bg-card rounded-2xl card-shadow overflow-hidden">
              <button
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-heading text-base sm:text-lg pr-4">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
                    open === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  open === faq.id ? "max-h-60" : "max-h-0"
                }`}
              >
                <p className="px-5 pb-5 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
        )}
        {!loading && previewFaqs.length === 0 && (
          <div className="text-center text-muted-foreground">FAQs are being updated. Please check again shortly.</div>
        )}

        <div data-faq-reveal className="text-center mt-8">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            View all FAQs →
          </Link>
        </div>
      </div>
    </section>
  );
}
