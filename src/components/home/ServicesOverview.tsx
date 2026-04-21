import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ArrowRight, Briefcase } from "lucide-react";
import { iconMap } from "@/lib/iconMap";
import { useServices } from "@/hooks/useServices";
import { Skeleton } from "@/components/ui/skeleton";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";
import { runRevealWhenVisible } from "@/lib/runRevealWhenVisible";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CardHover } from "@/components/ui/CardHover";

export default function ServicesOverview() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { data: services, loading } = useServices();

  useEffect(() => {
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

    let ctx: gsap.Context | null = null;
    const disconnect = runRevealWhenVisible(section, () => {
      ctx?.revert();
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const heads = header.querySelectorAll("[data-svc-head]");
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
          heads,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, stagger: desktop ? 0.06 : 0.07, duration: 0.65 },
        ).fromTo(
          cards,
          { opacity: 0, y: 36, scale: desktop ? 0.98 : 1 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.58,
            stagger: 0.08,
          },
          "-=0.4",
        );
      }, section);
    });

    return () => {
      disconnect();
      ctx?.revert();
    };
  }, [loading, services]);

  return (
    <section ref={sectionRef} className="section-padding section-shell min-h-0 bg-[#FAF8F5]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5] via-[#F5F0EB]/80 to-[#FAF8F5] pointer-events-none" />
      <div className="container-premium relative z-10">
        <div
          ref={headerRef}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-10 mb-10 lg:mb-12 max-w-6xl mx-auto lg:mx-0 lg:max-w-none"
        >
          <div className="max-w-xl">
            <div data-svc-head>
              <SectionLabel className="mb-3">Core Services</SectionLabel>
            </div>
            <h2
              data-svc-head
              className="font-heading text-3xl sm:text-4xl lg:text-[2.35rem] text-[#1A1A1A] leading-tight mb-0"
            >
              Everything Your Business Needs
            </h2>
          </div>
          <p
            data-svc-head
            className="text-[#6B6B6B] text-base sm:text-lg leading-relaxed max-w-md lg:text-right lg:max-w-sm shrink-0"
          >
            A complete ecosystem of industrial and human capital solutions
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[min(11rem,42vw)] sm:h-52 rounded-xl sm:rounded-2xl" />
              ))
            : services.map((service) => {
                const Icon = iconMap[service.icon] || Briefcase;
                return (
                  <div key={service.id} className="service-card h-full min-w-0">
                    <CardHover className="h-full rounded-xl sm:rounded-2xl">
                      <div className="group flex h-full min-h-0 flex-col bg-white border border-black/[0.06] rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-[0_10px_40px_rgba(26,26,26,0.06)] transition-colors hover:border-[#E8621A]/25">
                        <div className="mx-auto mb-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8621A]/10 ring-1 ring-[#E8621A]/10 sm:mx-0 sm:mb-4 sm:h-12 sm:w-12 sm:rounded-xl group-hover:bg-[#E8621A]/15 transition-colors">
                          <Icon size={18} className="text-[#E8621A] sm:hidden" />
                          <Icon size={22} className="text-[#E8621A] hidden sm:block" />
                        </div>
                        <h3 className="font-heading text-center text-[0.8125rem] font-semibold leading-snug text-[#1A1A1A] line-clamp-3 sm:mb-2 sm:text-left sm:text-lg sm:font-normal sm:line-clamp-none group-hover:text-[#E8621A] transition-colors">
                          {service.title}
                        </h3>
                        <p className="mt-1 flex-1 text-center text-[11px] leading-snug text-[#6B6B6B] line-clamp-4 sm:mt-0 sm:mb-4 sm:text-left sm:text-sm sm:leading-relaxed sm:line-clamp-none">
                          {service.description}
                        </p>
                        <Link
                          to="/services"
                          className="mt-2 inline-flex items-center justify-center gap-0.5 text-[11px] font-semibold text-[#E8621A] hover:gap-1.5 sm:justify-start sm:gap-1 sm:text-sm sm:hover:gap-2 transition-all"
                        >
                          Learn More <ArrowRight className="shrink-0 sm:hidden" size={12} />
                          <ArrowRight className="hidden shrink-0 sm:inline" size={14} />
                        </Link>
                      </div>
                    </CardHover>
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
