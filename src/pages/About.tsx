import { Heart, Lightbulb, Award, Zap } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Reveal } from "@/components/ui/Reveal";

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

export default function About() {
  return (
    <>
      <SEO
        title="About Us — Our Mission, Vision & Team"
        description="Learn about AKM Care — our mission to provide ethical, integrity-driven industrial and HR solutions across India. Meet Team AKM Care."
        keywords="AKM Care about, industrial company Ahmedabad, HR company Gujarat, training company India"
        canonical="/about"
      />
      {/* Hero */}
      <section className="section-padding section-shell">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-warm-beige to-background pointer-events-none" />
        <Reveal className="container-premium text-center max-w-3xl relative z-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary mb-4">Who we are</p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">About AKM Care</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            AKM Care provides integrated solutions on a single platform with ethics and integrity within a benchmarking value frame.
          </p>
        </Reveal>
      </section>

      {/* Vision & Mission */}
      <section className="section-padding">
        <div className="container-premium">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="premium-card bg-card/90 backdrop-blur-sm rounded-2xl p-8 border border-border/60 card-shadow hover:border-primary/15 transition-all duration-500 ease-in-out">
              <h2 className="font-heading text-2xl mb-4 text-primary">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become India's most trusted single-platform provider of industrial training, HR solutions, and e-commerce services — empowering businesses and communities with excellence.
              </p>
            </div>
            <div className="premium-card bg-card/90 backdrop-blur-sm rounded-2xl p-8 border border-border/60 card-shadow hover:border-primary/15 transition-all duration-500 ease-in-out">
              <h2 className="font-heading text-2xl mb-4 text-primary">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Providing all solutions on a single platform with ethics and integrity within a benchmarking value frame. We serve industries, institutions, NGOs, and government sectors Pan India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-warm-beige">
        <div className="container-premium">
          <h2 className="font-heading text-3xl sm:text-4xl text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => (
              <div key={v.title} className="premium-card bg-card/90 backdrop-blur-sm rounded-2xl p-6 text-center border border-border/60 card-shadow hover:border-primary/20 hover:-translate-y-1 transition-all duration-500 ease-in-out">
                <div className="w-14 h-14 rounded-xl bg-primary/10 ring-1 ring-primary/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-heading text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding">
        <div className="container-premium max-w-3xl text-center">
          <h2 className="font-heading text-3xl sm:text-4xl mb-6">Team AKM Care</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Our team comprises experienced professionals from diverse industries — training, HR, compliance, and sales. Together, we bring decades of collective expertise to deliver holistic solutions that transform businesses and uplift communities.
          </p>
        </div>
        <div className="container-premium mt-10">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
            alt="AKM Care professional team collaboration"
            loading="lazy"
            decoding="async"
            className="w-full max-w-4xl mx-auto h-64 sm:h-80 object-cover rounded-2xl border border-border/60 card-shadow"
          />
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-warm-beige">
        <div className="container-premium">
          <h2 className="font-heading text-3xl sm:text-4xl text-center mb-12">Our Journey</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
            {timeline.map((item, i) => (
              <div key={i} className="premium-card flex-shrink-0 w-[220px] snap-start bg-card/90 backdrop-blur-sm rounded-2xl p-6 border border-border/60 card-shadow hover:border-primary/20 transition-all duration-500 ease-in-out">
                <div className="font-heading text-xl text-primary mb-2">{item.year}</div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
