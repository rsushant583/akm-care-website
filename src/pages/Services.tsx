import { Briefcase } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useServices } from "@/hooks/useServices";
import { iconMap } from "@/lib/iconMap";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { servicesSchema } from "@/lib/schemas";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CardHover } from "@/components/ui/CardHover";

const categories = ["All", "Training", "HR", "Compliance", "Others"];

const heroImg =
  "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1400&q=80";

export default function Services() {
  const [filter, setFilter] = useState("All");
  const { data: services, loading } = useServices();
  const reduce = useReducedMotion();
  const filtered =
    filter === "All"
      ? services
      : services.filter((s) => String(s.category).toLowerCase() === filter.toLowerCase());

  return (
    <>
      <SEO
        title="Our Services — Training, HR, Compliance & More"
        description="Comprehensive industrial services including placement, manpower deployment, compliance consulting, policy formation, employment verification, and customized business solutions across India."
        keywords="placement services India, manpower deployment, industrial compliance, policy formation India, employment verification services, customized industrial solutions"
        canonical="/services"
        schema={servicesSchema}
      />
      <section className="section-padding relative overflow-hidden bg-[#FAF8F5]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8621A]/[0.06] via-transparent to-[#F5F0EB] pointer-events-none" />
        <div className="container-premium relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <SectionLabel className="mb-2">What we deliver</SectionLabel>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[2.75rem] text-[#1A1A1A] leading-tight mb-4">
              Our Services
            </h1>
            <p className="text-lg text-[#6B6B6B] leading-relaxed">
              A complete ecosystem of industrial and human capital solutions
            </p>
          </div>
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <img
              src={heroImg}
              alt="Industrial workforce and services operations"
              width={900}
              height={560}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-full h-52 sm:h-64 lg:h-72 object-cover rounded-2xl border border-black/[0.06] shadow-xl"
            />
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium">
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  filter === cat
                    ? "bg-[#E8621A] text-white shadow-lg shadow-[#E8621A]/25"
                    : "bg-[#FAF8F5] border border-black/[0.08] text-[#6B6B6B] hover:border-[#E8621A]/25"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6 lg:gap-8">
              {filtered.map((service, idx) => {
                const Icon = iconMap[service.icon] || Briefcase;
                const reverse = idx % 2 === 1;
                return (
                  <CardHover key={service.id} className="rounded-2xl">
                    <div
                      className={`grid md:grid-cols-2 gap-6 items-center rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-6 sm:p-8 shadow-sm ${
                        reverse ? "md:[direction:rtl]" : ""
                      }`}
                    >
                      <div className={`min-w-0 ${reverse ? "md:[direction:ltr]" : ""}`}>
                        <div className="w-14 h-14 rounded-2xl bg-[#E8621A]/10 flex items-center justify-center mb-4 ring-1 ring-[#E8621A]/10">
                          <Icon size={26} className="text-[#E8621A]" />
                        </div>
                        <h3 className="font-heading text-xl mb-2 text-[#1A1A1A]">{service.title}</h3>
                        <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5">{service.description}</p>
                        <Link
                          to="/contact"
                          className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#E8621A] text-white text-sm font-semibold shadow-md shadow-[#E8621A]/20 hover:brightness-105 transition-all"
                        >
                          Enquire Now
                        </Link>
                      </div>
                      <div className={`relative min-h-[180px] md:min-h-[220px] rounded-xl overflow-hidden border border-black/[0.06] bg-gradient-to-br from-[#E8621A]/10 to-[#F5F0EB] ${reverse ? "md:[direction:ltr]" : ""}`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon size={72} className="text-[#E8621A]/35" strokeWidth={1.25} />
                        </div>
                        <img
                          src={heroImg}
                          alt=""
                          width={640}
                          height={400}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-multiply"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </CardHover>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
