import { trainingCategories } from "@/data/fallback";
import { MessageSquare, Cpu, Brain, TrendingUp, Crown, Target, Headphones, Shield } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/SEO";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = { MessageSquare, Cpu, Brain, TrendingUp, Crown, Target, Headphones, Shield };

export default function Training() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", company: "", phone: "", type: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you! We'll get back to you shortly.");
    setFormData({ name: "", company: "", phone: "", type: "", message: "" });
  };

  return (
    <>
      <SEO
        title="All Kind of Training — Soft Skills, Technical & Behavioral"
        description="Professional training programs for industries — soft skills, technical training, behavioral development, commercial training, leadership, and safety compliance training."
        keywords="industrial training programs, soft skills training India, technical training Gujarat, behavioral training, leadership development, safety compliance training"
        canonical="/training"
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Training & Education</h1>
          <p className="text-lg text-muted-foreground">
            All Kind of Training — Shaping Professionals, Transforming Organizations
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="grid sm:grid-cols-2 gap-5">
            {trainingCategories.map((cat) => {
              const Icon = iconMap[cat.icon] || MessageSquare;
              const isOpen = expanded === cat.id;
              return (
                <div key={cat.id} className="bg-card rounded-2xl card-shadow overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : cat.id)}
                    className="w-full p-6 flex items-start gap-4 text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg">{cat.title}</h3>
                      {!isOpen && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{cat.description}</p>}
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-60" : "max-h-0"}`}>
                    <div className="px-6 pb-6">
                      <p className="text-muted-foreground leading-relaxed mb-4">{cat.description}</p>
                      <a href="#inquiry" className="text-primary font-medium hover:underline">Enquire Now →</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="inquiry" className="section-padding bg-warm-beige">
        <div className="container-premium max-w-2xl">
          <h2 className="font-heading text-3xl text-center mb-8">Training Inquiry</h2>
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 sm:p-8 card-shadow space-y-5">
            <input type="text" placeholder="Your Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <input type="text" placeholder="Company Name" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select Training Type</option>
              {trainingCategories.map((c) => <option key={c.id} value={c.title}>{c.title}</option>)}
            </select>
            <textarea placeholder="Additional Message" rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            <button type="submit" className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all">
              Submit Inquiry
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
