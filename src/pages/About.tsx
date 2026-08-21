import { Heart, Lightbulb, Award, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PAGE_SEO } from "@/data/seoPages";
import { breadcrumbSchema } from "@/lib/schemas";
import { BRAND } from "@/lib/config/brand";
import { motion, useReducedMotion } from "framer-motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CardHover } from "@/components/ui/CardHover";
import { shopCategoryPath } from "@/data/catalog/categories";

const values = [
  { icon: Heart, title: "Ethics", desc: "Conducting every engagement with honesty and moral principles." },
  { icon: Lightbulb, title: "Integrity", desc: "Upholding the highest standards of professional integrity." },
  { icon: Award, title: "Excellence", desc: "Striving for the best outcomes in every solution we deliver." },
  { icon: Zap, title: "Innovation", desc: "Embracing new ideas and technologies to drive progress." },
];

const timeline = [
  {
    year: "Foundation",
    desc: "Built as a single-platform provider of need-based industrial and HR services for pan-India clients, with ethics and integrity as the operating frame.",
  },
  { year: "Training", desc: "Launched corporate soft skill and behavioural training programmes." },
  { year: "Expansion", desc: "Extended services to placement, manpower, and compliance consulting." },
  { year: "Pan India", desc: "Operations scaled across multiple states and industrial hubs." },
  { year: "E-Commerce", desc: "Opened an online catalog for authentic fashion sold across India." },
];

const teamPhoto =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80";

export default function About() {
  const reduce = useReducedMotion();

  return (
    <>
      <SEO
        title={PAGE_SEO["/about"].title}
        description={PAGE_SEO["/about"].description}
        canonical="/about"
        schema={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "About", url: "/about" },
        ])}
      />
      <section className="section-padding relative overflow-hidden bg-[#FAF8F5]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8621A]/[0.07] via-transparent to-[#F5F0EB] pointer-events-none" />
        <div className="container-premium relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <SectionLabel className="mb-2">Who we are</SectionLabel>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[2.75rem] leading-tight mb-4">
              {reduce ? (
                <span className="text-[#1A1A1A]">{BRAND.name}</span>
              ) : (
                <motion.span
                  className="inline-block text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(110deg, #1a1a1a 0%, #2b2318 18%, #6b4420 32%, #d4922a 44%, #e8621a 50%, #f0c674 52%, #d4922a 58%, #2b2318 72%, #1a1a1a 100%)",
                    backgroundSize: "220% 100%",
                    WebkitBackgroundClip: "text",
                    filter: "drop-shadow(0 0 14px rgba(232, 98, 26, 0.2))",
                  }}
                  initial={{ backgroundPosition: "0% 50%" }}
                  animate={{ backgroundPosition: "100% 50%" }}
                  transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                >
                  {BRAND.name}
                </motion.span>
              )}
            </h1>
            <p className="text-base sm:text-lg text-[#1A1A1A] leading-relaxed mb-4 font-medium">
              {BRAND.description}
            </p>
            <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed mb-6">
              Official site:{" "}
              <a href="https://www.akmcare.in" className="text-[#E8621A] font-semibold hover:underline">
                www.akmcare.in
              </a>
              . Based in {BRAND.addressDisplay}. Shoppers buy online with pan-India delivery; businesses
              engage {BRAND.name} for training, HR and compliance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary h-11 px-5 inline-flex items-center justify-center">
                Shop catalog
              </Link>
              <Link to="/contact" className="btn-secondary h-11 px-5 inline-flex items-center justify-center">
                Contact
              </Link>
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
              alt="Professionals collaborating in a bright office (illustrative stock photo)"
              width={900}
              height={620}
              loading="eager"
              decoding="async"
              className="w-full max-h-[340px] lg:max-h-[380px] object-cover rounded-2xl border border-black/[0.06] shadow-[0_24px_60px_rgba(26,26,26,0.12)]"
            />
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium max-w-3xl space-y-8">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl text-[#1A1A1A] mb-3">What {BRAND.name} sells</h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              The online shop lists authentic fashion with live price and stock on each product page:
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm sm:text-base">
              {[
                ["Sarees", "sarees"],
                ["Ladies gowns", "ladies-gown"],
                ["Stitched lehengas", "stitched-lehenga"],
                ["Unstitched lehengas", "unstitched-lehenga"],
                ["3-piece suits", "3-piece-suits"],
                ["Men's jeans", "mens-jeans"],
              ].map(([label, slug]) => (
                <li key={slug}>
                  <Link
                    to={shopCategoryPath(slug)}
                    className="text-[#E8621A] font-semibold hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#6B6B6B] mt-4">
              Length and other specs (for example saree <span className="font-medium text-[#1A1A1A]">Mtrs APX</span>)
              appear only when filled in the catalog — see{" "}
              <Link to="/guides/saree-length" className="text-[#E8621A] font-semibold hover:underline">
                how to read saree length
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl sm:text-3xl text-[#1A1A1A] mb-3">Who the products are for</h2>
            <p className="text-[#6B6B6B] leading-relaxed">
              Shoppers across India who want to buy listed fashion online from {BRAND.name}, with checkout
              on this website. Industrial clients use{" "}
              <Link to="/services" className="text-[#E8621A] font-semibold hover:underline">
                services
              </Link>{" "}
              and{" "}
              <Link to="/training" className="text-[#E8621A] font-semibold hover:underline">
                training
              </Link>{" "}
              separately from the retail catalog.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl sm:text-3xl text-[#1A1A1A] mb-3">How we operate</h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-3">
              {BRAND.tagline} Delivery windows and unused-product returns are documented on{" "}
              <Link to="/shipping-returns" className="text-[#E8621A] font-semibold hover:underline">
                shipping and returns
              </Link>
              . Customer support: {BRAND.email}, {BRAND.phoneDisplay}, or{" "}
              <a href={BRAND.whatsappUrl} className="text-[#E8621A] font-semibold hover:underline">
                WhatsApp
              </a>
              .
            </p>
            <p className="text-sm text-[#6B6B6B]">
              Social:{" "}
              <a href={BRAND.social.youtube} className="text-[#E8621A] font-semibold hover:underline" rel="noopener noreferrer" target="_blank">
                YouTube
              </a>
              {" · "}
              <a href={BRAND.social.facebook} className="text-[#E8621A] font-semibold hover:underline" rel="noopener noreferrer" target="_blank">
                Facebook
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white border-t border-black/[0.04]">
        <div className="container-premium grid sm:grid-cols-2 gap-5 lg:gap-6">
          <CardHover className="rounded-2xl h-full">
            <div className="h-full rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-6 sm:p-8 pt-7 shadow-sm border-t-4 border-t-[#E8621A]">
              <h2 className="font-heading text-2xl mb-3 text-[#E8621A]">Our Vision</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                To remain a dependable single platform for industrial training, HR solutions, and an honest
                online fashion catalog — serving businesses and shoppers with clear information and fair
                dealings.
              </p>
            </div>
          </CardHover>
          <CardHover className="rounded-2xl h-full">
            <div className="h-full rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-6 sm:p-8 pt-7 shadow-sm border-t-4 border-t-[#E8621A]">
              <h2 className="font-heading text-2xl mb-3 text-[#E8621A]">Our Mission</h2>
              <p className="text-[#6B6B6B] leading-relaxed">
                Provide solutions on one platform with ethics and integrity. We serve industries,
                institutions, NGOs, and government sectors pan-India, alongside retail customers of the
                online shop.
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
            <h2 className="font-heading text-3xl sm:text-4xl mb-4 text-[#1A1A1A]">Team {BRAND.name}</h2>
            <p className="text-[#6B6B6B] leading-relaxed text-base sm:text-lg">
              Our team works across training, HR, compliance, and the online store. For roles and
              applications, see{" "}
              <Link to="/careers" className="text-[#E8621A] font-semibold hover:underline">
                careers
              </Link>
              .
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-black/[0.06] shadow-[0_20px_50px_rgba(26,26,26,0.1)]">
            <img
              src={teamPhoto}
              alt="Professionals collaborating in a bright office (illustrative stock photo)"
              width={900}
              height={560}
              loading="lazy"
              decoding="async"
              className="w-full h-56 sm:h-72 lg:h-80 object-cover"
            />
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
