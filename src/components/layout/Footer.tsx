import { Link } from "react-router-dom";
import { Youtube, MessageCircle, Facebook, Phone, Mail, MapPin } from "lucide-react";
import logo from "@/assets/akm-logo.jpeg";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Training", path: "/training" },
  { label: "Shop", path: "/shop" },
];

const serviceLinks = [
  "Training & Education",
  "Placement Services",
  "Manpower Deployment",
  "Compliance Consulting",
  "Policy Formation",
];

export default function Footer() {
  return (
    <footer className="bg-[#0F0F0F] text-card pt-20 pb-24 lg:pb-10">
      <div className="container-premium">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div>
            <div className="inline-flex bg-white/5 rounded-xl p-2 mb-4">
              <img src={logo} alt="AKM Care" width={160} height={64} loading="lazy" className="h-16 object-contain" />
            </div>
            <p className="text-sm text-card/70 leading-relaxed mb-6">
              A milestone for the training industry, HR, sales & marketing, and industrial solutions.
            </p>
            <div className="flex gap-3">
              <a href="https://www.youtube.com/@akmcare1309" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-primary transition-all">
                <Youtube size={18} />
              </a>
              <a href="https://wa.me/918200224226" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-primary transition-all">
                <MessageCircle size={18} />
              </a>
              <a href="https://www.facebook.com/share/1Jjs7ipP1x/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-primary transition-all" aria-label="AKM Care on Facebook">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="label-kicker text-white/40 mb-5">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-card/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="label-kicker text-white/40 mb-5">Our Services</h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((s) => (
                <li key={s}>
                  <Link to="/services" className="text-sm text-card/70 hover:text-primary transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="label-kicker text-white/40 mb-5">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-card/70">+91-8200224226</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-card/70">contact@akmcare.in, akmcare108@gmail.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-card/70">Ahmedabad, Gujarat, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-card/40">© 2025 AKM Care. All Rights Reserved.</p>
          <div className="flex gap-4 text-xs text-card/50">
            <Link to="/disclaimer" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/disclaimer" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
