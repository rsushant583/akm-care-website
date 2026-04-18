import { Sparkles, Users, Heart, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { submitCareerApplication } from "@/lib/submissions";
import { SEO } from "@/components/SEO";

const whyUs = [
  { icon: Sparkles, title: "Growth Opportunities", desc: "Continuous learning and career advancement paths." },
  { icon: Users, title: "Collaborative Culture", desc: "Work with passionate professionals across diverse domains." },
  { icon: Heart, title: "Purpose-Driven Work", desc: "Make a real impact on businesses and communities." },
  { icon: TrendingUp, title: "Pan India Exposure", desc: "Work with clients across multiple states and industries." },
];

export default function Careers() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "", resume: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submitCareerApplication({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        message: `${formData.message}${formData.resume ? `\nResume: ${formData.resume}` : ""}`,
      });
      if (!result.success) {
        toast.error("Could not submit application. Please try again.");
        return;
      }
      toast.success("Application submitted successfully!");
      setFormData({ name: "", email: "", phone: "", role: "", resume: "", message: "" });
    } catch {
      toast.error("Could not submit application. Please try again.");
    }
  };

  return (
    <>
      <SEO
        title="Careers — Join Team AKM Care"
        description="Build your career with AKM Care. We're looking for passionate professionals in HR, training, and operations. Send us your resume."
        keywords="jobs AKM Care, careers Ahmedabad, HR jobs Gujarat, industrial company jobs"
        canonical="/careers"
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Careers</h1>
          <p className="text-lg text-muted-foreground">
          Connect with team AKM Care to be the part of India's growing job placement Services for PAN India and abroad clients.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="bg-accent rounded-2xl p-8 text-center mb-14">
            <h2 className="font-heading text-2xl mb-3">Current Openings</h2>
            <p className="text-muted-foreground">
            No openings currently, but please share your recently updated CV for upcoming openings in future, either directly through this  website or on our email :- 
contact@akmcare.in & akmcare108@gmail.com
Based on our clients requirements and your eligibility criteria & candidature, your CV shall be forwarded to our clients.
            </p>
          </div>

          <h2 className="font-heading text-3xl text-center mb-10">Why Work With Us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {whyUs.map((item) => (
              <div key={item.title} className="bg-card rounded-2xl p-6 text-center card-shadow">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <item.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-heading text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl text-center mb-8">Apply Now</h2>
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 sm:p-8 card-shadow space-y-5">
              <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="text" placeholder="Role Interested In" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="url" placeholder="Resume Link (Google Drive / Dropbox)" value={formData.resume} onChange={(e) => setFormData({ ...formData, resume: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <textarea placeholder="Tell us about yourself" rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              <button type="submit" className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all">
                Submit Application
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
