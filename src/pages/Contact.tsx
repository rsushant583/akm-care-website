import { Phone, Mail, MessageCircle, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { submitContact } from "@/lib/submissions";
import { useServices } from "@/hooks/useServices";
import { SEO } from "@/components/SEO";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", service: "", message: "", website: "" });
  const [submitted, setSubmitted] = useState(false);
  const { data: services } = useServices();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submitContact(formData);
      if (!result.success) {
        toast.error(result.error || "Could not submit contact form. Please try again.");
        return;
      }
      toast.success("Message sent successfully!");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setFormData({ name: "", email: "", phone: "", service: "", message: "", website: "" });
    } catch {
      toast.error("Could not submit contact form. Please try again.");
    }
  };

  return (
    <>
      <SEO
        title="Contact Us — Get In Touch with AKM Care"
        description="Contact AKM Care. Reach us via phone, email, or WhatsApp. Headquartered in Ahmedabad, Gujarat. Available for partnerships, training enquiries, and business collaborations."
        keywords="contact AKM Care, Ahmedabad industrial company contact, Gujarat HR company"
        canonical="/contact"
      />
      <section className="section-padding bg-warm-beige">
        <div className="container-premium text-center max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6">Contact Us</h1>
          <p className="text-lg text-muted-foreground">We'd love to hear from you. Reach out through any channel below.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-5">
              {[
                { icon: Phone, label: "Phone", value: "+91-8200224226", action: "tel:+918200224226", cta: "Call Now" },
                { icon: Mail, label: "Email", value: "contact@akmcare.in, akmcare108@gmail.com", action: "mailto:contact@akmcare.in", cta: "Send Email" },
                { icon: MessageCircle, label: "WhatsApp", value: "+91-8200224226", action: "https://wa.me/918200224226", cta: "Chat on WhatsApp" },
                { icon: MapPin, label: "Location", value: "Ahmedabad, Gujarat, India", action: "", cta: "" },
              ].map((item) => (
                <div key={item.label} className="bg-card rounded-2xl p-6 card-shadow flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <item.icon size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="font-medium truncate">{item.value}</div>
                  </div>
                  {item.action && (
                    <a href={item.action} target={item.action.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap hover:brightness-110 transition-all">
                      {item.cta}
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div>
              {submitted ? (
                <div className="bg-accent rounded-2xl p-12 text-center card-shadow">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Send size={28} className="text-primary" />
                  </div>
                  <h3 className="font-heading text-2xl mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">Thank you for reaching out. We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 sm:p-8 card-shadow space-y-5">
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="hidden"
                    aria-hidden="true"
                  />
                  <input type="text" placeholder="Your Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <select value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Service Interested In</option>
                    {services.map((s) => <option key={s.id} value={s.title}>{s.title}</option>)}
                  </select>
                  <textarea placeholder="Your Message" rows={5} required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                  <button type="submit" className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="mt-14 rounded-2xl overflow-hidden card-shadow h-[300px] sm:h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235013.74862720812!2d72.43965!3d23.0225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="AKM Care Location"
            />
          </div>
        </div>
      </section>
    </>
  );
}
