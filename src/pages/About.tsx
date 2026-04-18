import { Heart, Lightbulb, Award, Zap } from "lucide-react";
import { SEO } from "@/components/SEO";
import { motion, useReducedMotion } from "framer-motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CardHover } from "@/components/ui/CardHover";

const values = [
  { icon: Heart, title: "Ethics", desc: "Conducting every engagement with honesty and moral principles." },
  { icon: Lightbulb, title: "Integrity", desc: "Upholding the highest standards of professional integrity." },
  { icon: Award, title: "Excellence", desc: "Striving for the best outcomes in every solution we deliver." },
  { icon: Zap, title: "Innovation", desc: "Embracing new ideas and technologies to drive progress." },
];

const timeline = [
  { year: "Foundation", desc: "A Well-known trustworthy name ensure need based multipln qualitative services for PAN India clients and provides all solutions on a single platform with ethics and integrity within a benchmarking value frame." },
  { year: "Training", desc: "Launched corporate soft skill & behavioral training programs" },
  { year: "Expansion", desc: "Extended services to placement, manpower, and compliance consulting" },
  { year: "Pan India", desc: "Operations scaled across multiple states and industrial hubs" },
  { year: "E-Commerce", desc: "Began curating authentic rural Indian products for online sale" },
];

const teamPhoto =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80";

export default function About() {
  const reduce = useReducedMotion();

  return (
    <>
      <SEO
        title="About Us — Our Mission, Vision & Team"
        description="Learn about AKM Care — our mission to provide ethical, integrity-driven industrial and HR solutions across India. Meet Team AKM Care."
        keywords="AKM Care about, industrial company Ahmedabad, HR company Gujarat, training company India"
        canonical="/about"
      />
      <section className="section-padding relative overflow-hidden bg-[#FAF8F5]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8621A]/[0.07] via-transparent to-[#F5F0EB] pointer-events-none" />
        <div className="container-premium relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <SectionLabel className="mb-2">Who we are</SectionLabel>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[2.75rem] text-[#1A1A1A] leading-tight mb-4">
              About AKM Care
            </h1>
            <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed mb-6">
              AKM Care provides integrated solutions on a single platform with ethics and integrity within a benchmarking value frame.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full bg-white border border-[#E8621A]/20 px-4 py-2 text-sm font-semibold text-[#1A1A1A] shadow-sm">
                500+ Industries Served
              </span>
              <span className="inline-flex items-center rounded-full bg-white border border-[#E8621A]/20 px-4 py-2 text-sm font-semibold text-[#1A1A1A] shadow-sm">
                10,000+ Professionals Trained
              </span>
            </div>
          </div>
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <img
              src={teamPhoto}
              alt="AKM Care professional team collaboration"
              width={900}
              height={620}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-full max-h-[340px] lg:max-h-[380px] object-cover rounded-2xl border border-black/[0.06] shadow-[0_24px_60px_rgba(26,26,26,0.12)]"
            />
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium grid sm:grid-cols-2 gap-5 lg:gap-6">
          <CardHover className="rounded-2xl h-full">
            <div className="h-full rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-6 sm:p-8 pt-7 shadow-sm border-t-4 border-t-[#E8621A]">
              <h2 className="font-heading text-2xl mb-3 text-[#E8621A]">Our Vision</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                To become India&apos;s most trusted single-platform provider of industrial training, HR solutions, and e-commerce services — empowering businesses and communities with excellence.
              </p>
            </div>
          </CardHover>
          <CardHover className="rounded-2xl h-full">
            <div className="h-full rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-6 sm:p-8 pt-7 shadow-sm border-t-4 border-t-[#E8621A]">
              <h2 className="font-heading text-2xl mb-3 text-[#E8621A]">Our Mission</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                Providing all solutions on a single platform with ethics and integrity within a benchmarking value frame. We serve industries, institutions, NGOs, and government sectors Pan India.
              </p>
            </div>
          </CardHover>
        </div>
      </section>

      <section className="section-padding bg-[#F5F0EB]">
        <div className="container-premium">
          <h2 className="font-heading text-3xl sm:text-4xl text-center mb-8 text-[#1A1A1A]">Our Core Values</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {values.map((v) => (
              <CardHover key={v.title} className="rounded-2xl h-full">
                <div className="h-full rounded-2xl bg-white p-5 sm:p-6 text-center border border-black/[0.06] transition-colors hover:border-[#E8621A] shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-[#E8621A]/12 flex items-center justify-center mx-auto mb-3">
                    <v.icon size={22} className="text-[#E8621A]" />
                  </div>
                  <h3 className="font-heading text-lg mb-2 text-[#1A1A1A]">{v.title}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-snug">{v.desc}</p>
                </div>
              </CardHover>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl mb-4 text-[#1A1A1A]">Team AKM Care</h2>
            <p className="text-[#6B6B6B] leading-relaxed text-base sm:text-lg">
              Our team comprises experienced professionals from diverse industries — training, HR, compliance, and sales. Together, we bring decades of collective expertise to deliver holistic solutions that transform businesses and uplift communities.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-black/[0.06] shadow-[0_20px_50px_rgba(26,26,26,0.1)]">
            <img
              src={teamPhoto}
              alt="AKM Care professional team collaboration"
              width={900}
              height={560}
              loading="lazy"
              decoding="async"
              className="w-full h-56 sm:h-72 lg:h-80 object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 sm:p-5">
              <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                Our team comprises experienced professionals from diverse industries — training, HR, compliance, and sales.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#F5F0EB]">
        <div className="container-premium">
          <h2 className="font-heading text-3xl sm:text-4xl text-center mb-8 text-[#1A1A1A]">Our Journey</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
            {timeline.map((item, i) => (
              <CardHover key={i} className="flex-shrink-0 w-[220px] snap-start rounded-2xl">
                <div className="rounded-2xl bg-white p-6 border border-black/[0.06] shadow-sm h-full">
                  <div className="font-heading text-xl text-[#E8621A] mb-2">{item.year}</div>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{item.desc}</p>
                </div>
              </CardHover>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
