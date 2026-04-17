import { Heart, Users, Target, HandHeart } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Reveal } from "@/components/ui/Reveal";

const initiatives = [
  { title: "Free Soft Skills Training", desc: "Complimentary soft skill and motivational training for schools, colleges, and NGOs in nearby communities." },
  { title: "Youth Empowerment", desc: "Training programs for village and city youth to build confidence, communication, and career readiness." },
  { title: "Community Awareness", desc: "Boosting morale and spreading awareness on personal development and professional growth." },
  { title: "Institutional Partnerships", desc: "Collaborating with organizations to execute CSR training programs on their behalf." },
];

export default function CSR() {
  return (
    <>
      <SEO
        title="CSR — Corporate Social Responsibility"
        description="AKM Care's corporate social responsibility initiatives. Contributing to community development, skill enhancement, and sustainable industrial practices across India."
        canonical="/csr"
      />
      <section className="section-padding section-shell bg-warm-beige">
        <Reveal className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Corporate Social Responsibility</h1>
          <p className="text-lg text-muted-foreground">
            We strongly believe that boosting the morale of people through extra awareness as well as assistance to the needy is the best contribution for society, country, and the entire universe.
          </p>
          <a
            href="https://www.facebook.com/share/1DzHMLUAbG/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-5 text-sm font-semibold text-primary hover:underline"
          >
            View our CSR activities on Facebook
          </a>
        </Reveal>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="grid sm:grid-cols-2 gap-6 mb-16">
            <div className="premium-card bg-card rounded-2xl p-8 card-shadow">
              <HandHeart size={32} className="text-primary mb-4" />
              <h2 className="font-heading text-2xl mb-3">Our Purpose</h2>
              <p className="text-muted-foreground leading-relaxed">
                AKM Care considers its responsibility for society. Through our CSR program, we provide free training through our expert faculty to communities, schools, colleges, and NGOs.
              </p>
            </div>
            <div className="premium-card bg-card rounded-2xl p-8 card-shadow">
              <Target size={32} className="text-primary mb-4" />
              <h2 className="font-heading text-2xl mb-3">Execution Model</h2>
              <p className="text-muted-foreground leading-relaxed">
                Training is conducted on behalf of client organizations in their surroundings, on Sundays, subject to availability of training schedule and faculty members.
              </p>
            </div>
          </div>

          <h2 className="font-heading text-3xl text-center mb-10">Key Initiatives</h2>
          <div className="grid sm:grid-cols-2 gap-5 mb-16">
            {initiatives.map((item, i) => (
              <div key={i} className="premium-card bg-warm-beige rounded-2xl p-6 card-shadow">
                <h3 className="font-heading text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Users, value: "500+", label: "Sessions Conducted" },
              { icon: Heart, value: "10,000+", label: "Lives Impacted" },
              { icon: Target, value: "50+", label: "Institutions Served" },
              { icon: HandHeart, value: "Pan India", label: "Reach" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon size={28} className="text-primary mx-auto mb-2" />
                <div className="font-heading text-2xl text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-primary rounded-2xl p-8 sm:p-12 text-center card-shadow">
            <h2 className="font-heading text-3xl text-primary-foreground mb-4">Want to Organize a CSR Session?</h2>
            <p className="text-primary-foreground/80 mb-6">Contact us to arrange free training for your community or organization.</p>
            <Link to="/contact" className="inline-flex items-center px-8 py-3.5 rounded-full bg-card text-primary font-semibold hover:scale-[1.02] transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
