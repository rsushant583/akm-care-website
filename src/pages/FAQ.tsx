import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useFAQ } from "@/hooks/useFAQ";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { faqSchema } from "@/lib/schemas";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

const categories = ["All", "General", "Training", "Services", "Products"];

export default function FAQ() {
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const { data: faqs, loading } = useFAQ();
  const filtered =
    filter === "All"
      ? faqs
      : faqs.filter((f) => String(f.category).toLowerCase() === filter.toLowerCase());

  return (
    <>
      <SEO
        title="Frequently Asked Questions"
        description="Get answers to commonly asked questions about AKM Care services, training, products, and support."
        keywords="AKM Care FAQ, training faq, products faq, HR services faq"
        canonical="/faq"
        schema={faqSchema(faqs.slice(0, 12).map((f) => ({ question: f.question, answer: f.answer })))}
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">Find answers to common questions about our services</p>
        </div>
      </section>

      <section className="section-padding">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="container-premium max-w-3xl">
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
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
          <div className="space-y-0">
            {filtered.map((faq) => (
              <div key={faq.id} className={`border-b border-black/10 py-6 px-4 -mx-4 rounded-[var(--radius-sm)] transition-all ${open === faq.id ? "bg-primary/[0.06]" : ""}`}>
                <button onClick={() => setOpen(open === faq.id ? null : faq.id)} className="w-full flex items-center justify-between text-left">
                  <span className={`text-[17px] font-medium pr-4 ${open === faq.id ? "text-primary" : "text-[#0F0F0F]"}`}>{faq.question}</span>
                  <ChevronDown size={20} className={`text-primary shrink-0 transition-transform duration-300 ${open === faq.id ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${open === faq.id ? "max-h-[500px]" : "max-h-0"}`}>
                  <p className="pt-3 text-[15px] font-light text-muted-foreground leading-[1.7]">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
          )}
        </motion.div>
      </section>
    </>
  );
}
