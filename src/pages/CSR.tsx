import { Heart, Users, Target, HandHeart } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Reveal } from "@/components/ui/Reveal";
import { motion, useReducedMotion } from "framer-motion";
import { CardHover } from "@/components/ui/CardHover";

const initiatives = [
  { title: "Free Soft Skills Training", desc: "Complimentary soft skill and motivational training for schools, colleges, and NGOs in nearby communities." },
  { title: "Youth Empowerment", desc: "Training programs for village and city youth to build confidence, communication, and career readiness." },
  { title: "Community Awareness", desc: "Boosting morale and spreading awareness on personal development and professional growth." },
  { title: "Institutional Partnerships", desc: "Collaborating with organizations to execute CSR training programs on their behalf." },
];

const gallery = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531206715517-76c393752a04?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
];

export default function CSR() {
  const reduce = useReducedMotion();

  return (
    <>
      <SEO
        title="CSR — Corporate Social Responsibility"
        description="AKM Care's corporate social responsibility initiatives. Contributing to community development, skill enhancement, and sustainable industrial practices across India."
        canonical="/csr"
      />
      <section className="section-padding section-shell relative overflow-hidden bg-[#F5F0EB]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8621A]/[0.07] to-transparent pointer-events-none" />
        <Reveal className="container-premium text-center max-w-3xl relative z-10">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[2.75rem] mb-4 text-[#1A1A1A]">
            Corporate Social Responsibility
          </h1>
          <p className="text-lg text-[#6B6B6B] leading-relaxed">
            We strongly believe that boosting the morale of people through extra awareness as well as assistance to the needy is the best contribution for society, country, and the entire universe.
          </p>
          <a
            href="https://www.facebook.com/share/1DzHMLUAbG/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-5 text-sm font-semibold text-[#E8621A] hover:underline"
          >
            View our CSR activities on Facebook
          </a>
        </Reveal>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium">
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden border border-black/[0.06] min-h-[200px] bg-[#1A1A1A]/5"
            >
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                alt=""
                width={800}
                height={500}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                aria-hidden
              />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/25 to-transparent min-h-[200px]">
                <HandHeart size={32} className="text-white mb-3" />
                <h2 className="font-heading text-2xl mb-2 text-white">Our Purpose</h2>
                <p className="text-white/85 text-sm leading-relaxed">
                  AKM Care considers its responsibility for society. Through our CSR program, we provide free training through our expert faculty to communities, schools, colleges, and NGOs.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="relative rounded-2xl overflow-hidden border border-black/[0.06] min-h-[200px] bg-[#1A1A1A]/5"
            >
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                alt=""
                width={800}
                height={500}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                aria-hidden
              />
              <div className="relative z-10 p-8 h-full flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/25 to-transparent min-h-[200px]">
                <Target size={32} className="text-white mb-3" />
                <h2 className="font-heading text-2xl mb-2 text-white">Execution Model</h2>
                <p className="text-white/85 text-sm leading-relaxed">
                  Training is conducted on behalf of client organizations in their surroundings, on Sundays, subject to availability of training schedule and faculty members.
                </p>
              </div>
            </motion.div>
          </div>

          <h2 className="font-heading text-3xl text-center mb-8 text-[#1A1A1A]">Key Initiatives</h2>
          <div className="mb-12 grid grid-cols-2 gap-3 sm:gap-5">
            {initiatives.map((item, i) => (
              <CardHover key={i} className="h-full min-w-0 rounded-xl sm:rounded-2xl">
                <div className="h-full rounded-xl border border-black/[0.06] bg-[#FAF8F5] p-3.5 shadow-sm sm:rounded-2xl sm:p-6">
                  <h3 className="mb-1.5 font-heading text-sm font-semibold leading-snug text-[#1A1A1A] line-clamp-3 sm:mb-2 sm:text-lg sm:font-normal sm:line-clamp-none">
                    {item.title}
                  </h3>
                  <p className="text-[11px] leading-snug text-[#6B6B6B] line-clamp-5 sm:text-sm sm:leading-relaxed sm:line-clamp-none">
                    {item.desc}
                  </p>
                </div>
              </CardHover>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {[
              { icon: Users, value: "500+", label: "Sessions Conducted" },
              { icon: Heart, value: "10,000+", label: "Lives Impacted" },
              { icon: Target, value: "50+", label: "Institutions Served" },
              { icon: HandHeart, value: "Pan India", label: "Reach" },
            ].map((stat) => (
              <div key={stat.label} className="text-center rounded-2xl bg-[#F5F0EB] border border-black/[0.06] py-6 px-3">
                <stat.icon size={28} className="text-[#E8621A] mx-auto mb-2" />
                <div className="font-heading text-2xl text-[#E8621A]">{stat.value}</div>
                <div className="text-sm text-[#6B6B6B]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-8 sm:p-12 text-center bg-[#E8621A] text-white shadow-lg mb-12">
            <h2 className="font-heading text-3xl mb-4 text-white">Want to Organize a CSR Session?</h2>
            <p className="text-white/85 mb-6 max-w-xl mx-auto">
              Contact us to arrange free training for your community or organization.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3.5 rounded-full bg-white text-[#E8621A] font-semibold hover:scale-[1.02] transition-transform"
            >
              Contact Us
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide -mx-2 px-2">
            {gallery.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                width={400}
                height={260}
                loading="lazy"
                decoding="async"
                className="h-40 sm:h-48 w-64 sm:w-80 shrink-0 snap-start rounded-xl object-cover border border-black/[0.06] shadow-md"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
