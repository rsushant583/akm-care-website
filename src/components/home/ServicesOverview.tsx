import { Link } from "react-router-dom";
import { useRef } from "react";
import { ArrowRight, Briefcase } from "lucide-react";
import { iconMap } from "@/lib/iconMap";
import { useServices } from "@/hooks/useServices";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, useInView } from "framer-motion";
import { fadeUp, stagger } from "@/lib/animations";

export default function ServicesOverview() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const { data: services, loading } = useServices();

  return (
    <section ref={sectionRef} className="section-padding section-shell min-h-0 bg-[var(--surface-cream)]">
      <div className="container-premium relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate={isInView ? "visible" : "hidden"} className="mb-16 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-8 w-[3px] rounded-full bg-primary" />
            <p className="label-kicker text-primary">Core Services</p>
          </div>
          <h2 className="text-[var(--size-h2)] mb-4 text-[#0A0A0A]">
            Everything Your Business Needs
          </h2>
          <p className="text-[18px] leading-[1.7] text-[#787878]">
            A complete ecosystem of industrial and human capital solutions
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))
            : services.map((service, idx) => {
                const Icon = iconMap[service.icon] || Briefcase;
                const spanClass =
                  idx % 6 === 0 ? "lg:col-span-5" :
                  idx % 6 === 1 ? "lg:col-span-4" :
                  idx % 6 === 2 ? "lg:col-span-3" :
                  idx % 6 === 3 ? "lg:col-span-3" :
                  idx % 6 === 4 ? "lg:col-span-5" : "lg:col-span-4";
                return (
                  <motion.div
                    key={service.id}
                    variants={fadeUp}
                    className={`${spanClass} group relative bg-white border border-black/5 rounded-[var(--radius-lg)] p-7 min-h-[160px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:bg-primary hover:shadow-[var(--shadow-saffron)]`}
                  >
                    <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-white/20 transition-colors">
                      <Icon size={20} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-[22px] mb-2 text-[#0A0A0A] group-hover:text-white transition-colors">{service.title}</h3>
                    <p className="text-sm text-[#787878] leading-relaxed mb-4 line-clamp-2 group-hover:text-white/85 transition-colors">{service.description}</p>
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:text-white transition-all"
                    >
                      Learn More <ArrowRight size={14} />
                    </Link>
                  </motion.div>
                );
              })}
          <motion.div variants={fadeUp} className="lg:col-span-5 rounded-[var(--radius-lg)] bg-[#0A0A0A] p-7 text-white flex flex-col justify-center">
            <p className="text-white/70 mb-2 label-kicker">Premium Support</p>
            <h3 className="text-[30px] mb-3">Explore All Services</h3>
            <Link to="/services" className="inline-flex items-center gap-2 text-primary">
              Explore All Services <ArrowRight size={16} />
            </Link>
          </motion.div>
        </motion.div>
        {!loading && services.length === 0 && (
          <div className="text-center mt-8 text-muted-foreground">
            Services are being updated. Please check again shortly.
          </div>
        )}
      </div>
    </section>
  );
}
