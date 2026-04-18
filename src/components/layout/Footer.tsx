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
    <footer className="relative bg-[#1A1A1A] text-white pt-2 pb-24 lg:pb-10">
      <div className="h-1 w-full bg-[#E8621A]" aria-hidden />
      <div className="container-premium pt-12 lg:pt-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div>
            <img src={logo} alt="AKM Care" width={160} height={64} loading="lazy" decoding="async" className="h-14 object-contain mb-4" />
            <p className="text-sm text-white/65 leading-relaxed mb-6">
              A milestone for the training industry, HR, sales & marketing, and industrial solutions.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.youtube.com/@akmcare1309"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E8621A] transition-all duration-300"
              >
                <Youtube size={16} />
              </a>
              <a
                href="https://wa.me/918200224226"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E8621A] transition-all duration-300"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="https://www.facebook.com/share/1Jjs7ipP1x/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E8621A] transition-all duration-300"
                aria-label="AKM Care on Facebook"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-lg mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-white/65 hover:text-[#F5A623] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg mb-4 text-white">Our Services</h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((s) => (
                <li key={s}>
                  <Link to="/services" className="text-sm text-white/65 hover:text-[#F5A623] transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="text-[#E8621A] mt-0.5 shrink-0" />
                <span className="text-sm text-white/65">+91-8200224226</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={16} className="text-[#E8621A] mt-0.5 shrink-0" />
                <span className="text-sm text-white/65">contact@akmcare.in, akmcare108@gmail.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#E8621A] mt-0.5 shrink-0" />
                <span className="text-sm text-white/65">Ahmedabad, Gujarat, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/45">© 2025 AKM Care. All Rights Reserved.</p>
          <div className="flex gap-4 text-xs text-white/45">
            <Link to="/disclaimer" className="hover:text-[#F5A623] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/disclaimer" className="hover:text-[#F5A623] transition-colors">
              Terms
            </Link>
            <Link to="/disclaimer" className="hover:text-[#F5A623] transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
