import { Heart, Lightbulb, Award, Zap } from "lucide-react";
import { SEO } from "@/components/SEO";

const values = [
  { icon: Heart, title: "Ethics", desc: "Conducting every engagement with honesty and moral principles." },
  { icon: Lightbulb, title: "Integrity", desc: "Upholding the highest standards of professional integrity." },
  { icon: Award, title: "Excellence", desc: "Striving for the best outcomes in every solution we deliver." },
  { icon: Zap, title: "Innovation", desc: "Embracing new ideas and technologies to drive progress." },
];

const timeline = [
  { year: "Foundation", desc: "AKM Care established as a proprietary firm in Gujarat" },
  { year: "Training", desc: "Launched corporate soft skill & behavioral training programs" },
  { year: "Expansion", desc: "Extended services to placement, manpower, and compliance consulting" },
  { year: "Logistics", desc: "AKM Freight launched to serve freight & logistics needs" },
  { year: "Pan India", desc: "Operations scaled across multiple states and industrial hubs" },
  { year: "E-Commerce", desc: "Began curating authentic rural Indian products for online sale" },
];

export default function About() {
  return (
    <>
      <SEO
        title="About Us — Our Mission, Vision & Team"
        description="Learn about AKM Care & AKM Freight — our mission to provide ethical, integrity-driven industrial and HR solutions across India. Meet Team AKM Care."
        keywords="AKM Care about, industrial company Ahmedabad, HR company Gujarat, training company India"
        canonical="/about"
      />
      {/* Hero */}
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">About AKM Care</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            AKM Care and AKM Freight provides all solutions on a single platform with ethics and integrity within a benchmarking value frame.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section-padding">
        <div className="container-premium">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl p-8 card-shadow">
              <h2 className="font-heading text-2xl mb-4 text-primary">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become India's most trusted single-platform provider of industrial training, HR solutions, logistics, and e-commerce services — empowering businesses and communities with excellence.
              </p>
            </div>
            <div className="bg-card rounded-2xl p-8 card-shadow">
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
              <div key={v.title} className="bg-card rounded-2xl p-6 text-center card-shadow">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
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
            Our team comprises experienced professionals from diverse industries — training, HR, logistics, compliance, and sales. Together, we bring decades of collective expertise to deliver holistic solutions that transform businesses and uplift communities.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-warm-beige">
        <div className="container-premium">
          <h2 className="font-heading text-3xl sm:text-4xl text-center mb-12">Our Journey</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
            {timeline.map((item, i) => (
              <div key={i} className="flex-shrink-0 w-[220px] snap-start bg-card rounded-2xl p-6 card-shadow">
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
