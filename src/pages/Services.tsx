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
        description="Comprehensive industrial services including placement, manpower deployment, compliance consulting, logistics, employment verification, and customized business solutions across India."
        keywords="placement services India, manpower deployment, industrial compliance, logistics freight Gujarat, employment verification services, customized industrial solutions"
        canonical="/services"
        schema={servicesSchema}
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Our Services</h1>
          <p className="text-lg text-muted-foreground">
            A complete ecosystem of industrial and human capital solutions
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
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
                <div key={service.id} className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover hover:-translate-y-1.5 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-heading text-lg mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
                  <Link to="/contact" className="inline-flex items-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">
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
