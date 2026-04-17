import { Link } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { ArrowRight, Briefcase } from "lucide-react";
import { iconMap } from "@/lib/iconMap";
import { useServices } from "@/hooks/useServices";
import { Skeleton } from "@/components/ui/skeleton";
import { gsap, ScrollTrigger } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";

export default function ServicesOverview() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { data: services, loading } = useServices();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;
    if (!section || !header || !grid || loading) return;

    const cards = grid.querySelectorAll<HTMLElement>(".service-card");
    if (!cards.length) return;

    if (prefersReducedMotion()) {
      gsap.set([...header.querySelectorAll("[data-svc-head]"), ...cards], {
        clearProps: "all",
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        gsap.set(header.querySelectorAll("[data-svc-head]"), { opacity: 0, y: 40 });
        gsap.set(cards, { opacity: 0, y: 72, scale: 0.94 });

        const scrollDistance = Math.min(4200, 1400 + cards.length * 380);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${scrollDistance}`,
            pin: true,
            scrub: 0.85,
            anticipatePin: 1,
          },
        });

        tl.to(header.querySelectorAll("[data-svc-head]"), {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.35,
          ease: "none",
        });

        cards.forEach((card, i) => {
          tl.to(
            card,
            { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "none" },
            0.22 + i * 0.38,
          );
        });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      mm.add("(max-width: 1023px)", () => {
        gsap.set(header.querySelectorAll("[data-svc-head]"), { opacity: 0, y: 32 });
        gsap.set(cards, { opacity: 0, y: 48 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        });

        tl.to(header.querySelectorAll("[data-svc-head]"), {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.07,
          ease: "power3.out",
        }).to(
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.07,
            ease: "power3.out",
          },
          "-=0.45",
        );

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    }, section);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, [loading, services]);

  return (
    <section ref={sectionRef} className="section-padding section-shell min-h-0">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-warm-beige/60 to-background pointer-events-none" />
      <div className="container-premium relative z-10">
        <div ref={headerRef} className="text-center mb-16 max-w-2xl mx-auto">
          <div
            data-svc-head
            className="inline-flex items-center rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-4 border border-primary/15"
          >
            Core Services
          </div>
          <h2 data-svc-head className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-4">
            Everything Your Business Needs
          </h2>
          <p data-svc-head className="text-muted-foreground text-lg leading-relaxed">
            A complete ecosystem of industrial and human capital solutions
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))
            : services.map((service) => {
                const Icon = iconMap[service.icon] || Briefcase;
                return (
                  <div
                    key={service.id}
                    className="service-card group premium-card bg-card/90 backdrop-blur-sm border border-border/60 rounded-2xl p-6 card-shadow hover:card-shadow-hover hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 ease-in-out"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 ring-1 ring-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <h3 className="font-heading text-lg mb-2 group-hover:text-primary transition-colors">{service.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
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
          <div className="text-center mt-8 text-muted-foreground">
            Services are being updated. Please check again shortly.
          </div>
        )}
      </div>
    </section>
  );
}
