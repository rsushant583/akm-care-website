import { trainingCategories } from "@/data/fallback";
import { MessageSquare, Cpu, Brain, TrendingUp, Crown, Target, Headphones, Shield, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/SEO";
import { motion, useReducedMotion } from "framer-motion";
import { CardHover } from "@/components/ui/CardHover";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = { MessageSquare, Cpu, Brain, TrendingUp, Crown, Target, Headphones, Shield };

const trainingImg =
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80";

const reasons = trainingCategories.slice(0, 5).map((c) => c.title);

export default function Training() {
  const [formData, setFormData] = useState({ name: "", company: "", phone: "", type: "", message: "" });
  const reduce = useReducedMotion();

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
      <section className="section-padding bg-[#F5F0EB]">
        <div className="container-premium grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[2.75rem] text-[#1A1A1A] leading-tight mb-4">
              Training & Education
            </h1>
            <p className="text-lg text-[#6B6B6B] mb-6">
              All Kind of Training — Shaping Professionals, Transforming Organizations
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E8621A]/20 px-4 py-2 text-sm font-semibold text-[#1A1A1A] shadow-sm">
                10,000+ Professionals Trained
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E8621A]/20 px-4 py-2 text-sm font-semibold text-[#1A1A1A] shadow-sm">
                500+ Industries Served
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl lg:max-w-none mx-auto"
          >
            <img
              src={trainingImg}
              alt="Professional training classroom session"
              width={900}
              height={600}
              loading="eager"
              decoding="async"
              className="w-full h-[220px] sm:h-[280px] lg:h-[min(380px,42vh)] object-cover rounded-2xl border border-black/[0.06] shadow-xl"
            />
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium">
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-5">
            {trainingCategories.map((cat) => {
              const Icon = iconMap[cat.icon] || MessageSquare;
              return (
                <CardHover key={cat.id} className="rounded-xl sm:rounded-2xl h-full min-w-0">
                  <div className="flex h-full min-h-0 flex-col rounded-xl border border-black/[0.06] bg-[#FAF8F5] p-3 shadow-sm sm:flex-row sm:gap-4 sm:rounded-2xl sm:p-5 md:p-6">
                    <div className="mx-auto mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8621A]/10 sm:mx-0 sm:mb-0 sm:h-12 sm:w-12 sm:rounded-xl">
                      <Icon size={18} className="text-[#E8621A] sm:hidden" />
                      <Icon size={22} className="text-[#E8621A] hidden sm:block" />
                    </div>
                    <div className="min-w-0 flex flex-1 flex-col text-center sm:text-left">
                      <h3 className="font-heading text-[0.8125rem] font-semibold leading-snug text-[#1A1A1A] line-clamp-3 sm:mb-1 sm:text-lg sm:font-normal sm:line-clamp-none">
                        {cat.title}
                      </h3>
                      <p className="mt-1 flex-1 text-[11px] leading-snug text-[#6B6B6B] line-clamp-4 sm:mt-0 sm:text-sm sm:leading-relaxed sm:line-clamp-3 sm:mb-3">
                        {cat.description}
                      </p>
                      <a href="#inquiry" className="mt-2 text-[11px] font-semibold text-[#E8621A] hover:underline sm:mt-0 sm:text-sm">
                        <span className="sm:hidden">Enquire →</span>
                        <span className="hidden sm:inline">Enquire Now →</span>
                      </a>
                    </div>
                  </div>
                </CardHover>
              );
            })}
          </div>
        </div>
      </section>

      <section id="inquiry" className="section-padding bg-[#F5F0EB]">
        <div className="container-premium">
          <h2 className="font-heading text-3xl sm:text-4xl text-center lg:text-left mb-6 text-[#1A1A1A]">Training Inquiry</h2>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-black/[0.06] shadow-lg space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
              />
              <input
                type="text"
                placeholder="Company Name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
              >
                <option value="">Select Training Type</option>
                {trainingCategories.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Additional Message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35 resize-none"
              />
              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#E8621A] text-white font-semibold text-base hover:brightness-105 transition-all"
              >
                Submit Inquiry
              </button>
            </form>

            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-black/[0.06] shadow-md">
                <img
                  src={trainingImg}
                  alt=""
                  width={800}
                  height={480}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-40 object-cover"
                  aria-hidden
                />
              </div>
              <div className="bg-white rounded-2xl p-6 border border-black/[0.06] shadow-sm">
                <ul className="space-y-3">
                  {reasons.map((title) => (
                    <li key={title} className="flex items-start gap-3 text-sm text-[#6B6B6B]">
                      <CheckCircle2 className="text-[#E8621A] shrink-0 mt-0.5" size={18} />
                      <span className="font-medium text-[#1A1A1A]">{title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
