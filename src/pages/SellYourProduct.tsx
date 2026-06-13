import { Store, TrendingUp, Users, ShieldCheck, Percent, Upload, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { submitVendorApplication } from "@/lib/submissions";
import { SEO } from "@/components/SEO";
import { motion, useReducedMotion } from "framer-motion";

const benefits = [
  {
    icon: Store,
    title: "Pan-India Reach",
    desc: "Showcase your products to AKM Care's nationwide customer base through our trusted marketplace.",
  },
  {
    icon: TrendingUp,
    title: "Growth Support",
    desc: "Benefit from our marketing, logistics guidance, and seller onboarding support to scale your business.",
  },
  {
    icon: Users,
    title: "Trusted Platform",
    desc: "Sell alongside verified brands on a platform built on ethics, integrity, and customer trust.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Onboarding",
    desc: "Transparent verification process with dedicated admin review before your store goes live.",
  },
];

const categories = [
  "Food & Groceries",
  "Handicrafts & Artisan",
  "Health & Wellness",
  "Industrial Supplies",
  "Training Materials",
  "Electronics & Accessories",
  "Home & Lifestyle",
  "Other",
];

export default function SellYourProduct() {
  const reduce = useReducedMotion();
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    business_name: "",
    owner_name: "",
    mobile: "",
    email: "",
    gst_number: "",
    product_category: "",
    business_address: "",
    product_description: "",
    website_links: "",
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await submitVendorApplication(formData, files);
      if (!result.success) {
        toast.error(result.error || "Could not submit application. Please try again.");
        return;
      }
      toast.success("Application submitted! Our team will review and contact you shortly.");
      setFormData({
        business_name: "",
        owner_name: "",
        mobile: "",
        email: "",
        gst_number: "",
        product_category: "",
        business_address: "",
        product_description: "",
        website_links: "",
      });
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Could not submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Sell Your Product — AKM Care Marketplace"
        description="Become a vendor on AKM Care's marketplace. List your products, reach pan-India customers, and grow your business with our trusted platform."
        keywords="sell on AKM Care, vendor registration, marketplace India, list products online"
        canonical="/sell-your-product"
      />

      <section className="section-padding bg-[#F5F0EB] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_20%,rgba(232,98,26,0.1),transparent_60%)] pointer-events-none" />
        <div className="container-premium relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#E8621A]/15 text-xs font-semibold text-[#E8621A] mb-5">
              <Store size={14} /> AKM Care Marketplace
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[2.75rem] text-[#1A1A1A] mb-4">
              Sell Your Product on Our Page
            </h1>
            <p className="text-lg text-[#6B6B6B] leading-relaxed mb-8">
              Join our growing marketplace and reach customers across India. We handle the platform — you focus on delivering quality products.
            </p>
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E8621A] text-white font-semibold shadow-lg shadow-[#E8621A]/25 hover:brightness-105 transition-all"
            >
              Become a Vendor <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-premium">
          <h2 className="font-heading text-3xl text-center mb-3 text-[#1A1A1A]">Why Sell With AKM Care?</h2>
          <p className="text-center text-[#6B6B6B] max-w-2xl mx-auto mb-10">
            A marketplace built on trust, ethics, and pan-India reach — designed for vendors who want sustainable growth.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {benefits.map((item, i) => (
              <motion.div
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-6 text-center shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8621A]/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon size={22} className="text-[#E8621A]" />
                </div>
                <h3 className="font-heading text-lg mb-2 text-[#1A1A1A]">{item.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-14">
            <div className="rounded-2xl border border-black/[0.06] bg-[#FAF8F5] p-8">
              <div className="flex items-center gap-3 mb-4">
                <Percent size={24} className="text-[#E8621A]" />
                <h3 className="font-heading text-2xl text-[#1A1A1A]">Commission & Listing Model</h3>
              </div>
              <ul className="space-y-3 text-[#6B6B6B] text-sm leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-[#E8621A] font-bold shrink-0">•</span>
                  <span><strong className="text-[#1A1A1A]">Zero listing fee</strong> — apply and get reviewed at no upfront cost.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#E8621A] font-bold shrink-0">•</span>
                  <span><strong className="text-[#1A1A1A]">Competitive commission</strong> — a standard percentage on successful sales only (details shared on approval).</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#E8621A] font-bold shrink-0">•</span>
                  <span><strong className="text-[#1A1A1A]">Transparent pricing</strong> — you set your product price; we handle platform visibility.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#E8621A] font-bold shrink-0">•</span>
                  <span><strong className="text-[#1A1A1A]">Admin-verified listings</strong> — every vendor application is reviewed before going live.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#E8621A]/20 bg-gradient-to-br from-[#E8621A]/5 to-[#F5F0EB] p-8 flex flex-col justify-center">
              <h3 className="font-heading text-2xl text-[#1A1A1A] mb-3">How It Works</h3>
              <ol className="space-y-4 text-sm text-[#6B6B6B]">
                {[
                  "Submit your vendor application with business details and documents.",
                  "Our admin team reviews and verifies your application within 3–5 business days.",
                  "Once approved, your vendor profile is created and you'll receive onboarding instructions.",
                  "List products, manage orders, and track performance from your future vendor dashboard.",
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8621A] text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div ref={formRef} id="vendor-form" className="max-w-2xl mx-auto scroll-mt-28">
            <h2 className="font-heading text-3xl text-center mb-2 text-[#1A1A1A]">Vendor Registration</h2>
            <p className="text-center text-[#6B6B6B] mb-8">Fill in your business details to apply as a vendor on AKM Care.</p>

            <form
              onSubmit={handleSubmit}
              className="bg-[#FAF8F5] rounded-2xl p-6 sm:p-8 border border-black/[0.06] shadow-sm space-y-5"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <input
                  type="text"
                  placeholder="Business Name *"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
                />
                <input
                  type="text"
                  placeholder="Owner Name *"
                  required
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <input
                  type="tel"
                  placeholder="Mobile Number *"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
                />
              </div>
              <input
                type="text"
                placeholder="GST Number (Optional)"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
              />
              <select
                required
                value={formData.product_category}
                onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
              >
                <option value="">Product Category *</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Business Address *"
                rows={3}
                required
                value={formData.business_address}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35 resize-none"
              />
              <textarea
                placeholder="Product Description *"
                rows={4}
                required
                value={formData.product_description}
                onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35 resize-none"
              />
              <input
                type="url"
                placeholder="Website / Social Media Links"
                value={formData.website_links}
                onChange={(e) => setFormData({ ...formData, website_links: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A]/35"
              />

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Upload Documents (GST Certificate, ID Proof, Product Images — PDF/JPG/PNG, max 5 files, 5MB each)
                </label>
                <div className="flex flex-col gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E8621A]/30 bg-white px-4 py-6 text-sm font-medium text-[#6B6B6B] hover:border-[#E8621A]/50 transition-colors">
                    <Upload size={18} className="text-[#E8621A]" />
                    Choose files
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  {files.length > 0 ? (
                    <ul className="space-y-2">
                      {files.map((file, i) => (
                        <li
                          key={`${file.name}-${i}`}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm border border-black/[0.06]"
                        >
                          <span className="truncate text-[#1A1A1A]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="shrink-0 text-[#E8621A] font-medium hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full bg-[#E8621A] text-white font-semibold text-base hover:brightness-105 transition-all disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Vendor Application"}
              </button>
              <p className="text-xs text-center text-[#6B6B6B]">
                By submitting, you agree to our{" "}
                <Link to="/disclaimer" className="text-[#E8621A] hover:underline">
                  terms and policies
                </Link>
                . Questions?{" "}
                <Link to="/contact" className="text-[#E8621A] hover:underline">
                  Contact us
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
