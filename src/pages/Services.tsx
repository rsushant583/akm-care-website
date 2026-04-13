import { Briefcase } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { iconMap } from "@/lib/iconMap";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { servicesSchema } from "@/lib/schemas";

const categories = ["All", "Training", "HR", "Logistics", "Compliance", "Others"];

export default function Services() {
  const [filter, setFilter] = useState("All");
  const { data: services, loading } = useServices();
  const filtered =
    filter === "All"
      ? services
      : services.filter((s) => String(s.category).toLowerCase() === filter.toLowerCase());

  return (
    <>
      <SEO
        title="Our Services — Training, HR, Logistics, Compliance & More"
        description="Comprehensive industrial services including placement, manpower deployment, compliance consulting, policy formation, logistics, employment verification, and customized business solutions across India."
        keywords="placement services India, manpower deployment, industrial compliance, policy formation India, logistics freight Gujarat, employment verification services, customized industrial solutions"
        canonical="/services"
        schema={servicesSchema}
      />
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-warm-beige to-background pointer-events-none" />
        <div className="container-premium text-center max-w-3xl relative z-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary mb-4">What we deliver</p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Our Services</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A complete ecosystem of industrial and human capital solutions
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  filter === cat
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card border border-border/70 text-muted-foreground hover:border-primary/20"
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((service) => {
              const Icon = iconMap[service.icon] || Briefcase;
              return (
                <div
                  key={service.id}
                  className="group bg-card/90 backdrop-blur-sm rounded-2xl p-6 border border-border/60 card-shadow hover:card-shadow-hover hover:-translate-y-1.5 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-heading text-lg mb-2 group-hover:text-primary transition-colors">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:brightness-105 transition-all"
                  >
                    Enquire Now
                  </Link>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>
    </>
  );
}
