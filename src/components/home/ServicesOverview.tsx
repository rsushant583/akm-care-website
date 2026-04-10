import { Link } from "react-router-dom";
import { ArrowRight, Briefcase } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { iconMap } from "@/lib/iconMap";
import { useServices } from "@/hooks/useServices";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesOverview() {
  const { ref, isVisible } = useScrollAnimation();
  const { data: services, loading } = useServices();

  return (
    <section className="section-padding bg-gradient-to-b from-warm-beige to-background">
      <div className="container-premium">
        <div className="text-center mb-14">
          <div className="inline-flex items-center rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-semibold mb-4">
            Core Services
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-4">
            Everything Your Business Needs
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete ecosystem of industrial and human capital solutions
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))
            : services.map((service, i) => {
                const Icon = iconMap[service.icon] || Briefcase;
                return (
                  <div
                    key={service.id}
                    className={`group bg-card/95 border border-border/60 rounded-2xl p-6 card-shadow hover:card-shadow-hover hover:-translate-y-1.5 hover:border-primary/30 transition-all duration-200 ${
                      isVisible ? "animate-fade-up" : "opacity-0"
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <h3 className="font-heading text-lg mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {service.description}
                    </p>
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
                    >
                      Learn More <ArrowRight size={14} />
                    </Link>
                  </div>
                );
              })}
        </div>
        {!loading && services.length === 0 && (
          <div className="text-center mt-8 text-muted-foreground">Services are being updated. Please check again shortly.</div>
        )}
      </div>
    </section>
  );
}
