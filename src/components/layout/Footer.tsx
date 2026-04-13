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
  "Logistics & Freight",
  "Compliance Consulting",
  "Policy Formation",
];

export default function Footer() {
  return (
    <footer className="bg-foreground text-card pt-16 pb-24 lg:pb-8">
      <div className="container-premium">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div>
            <img src={logo} alt="AKM Care" width={160} height={64} loading="lazy" className="h-16 object-contain mb-4" />
            <p className="text-sm text-card/70 leading-relaxed mb-5">
              A Milestone for Training Industry, HR, Sales & Marketing, Logistics & Industrial Solutions.
            </p>
            <div className="flex gap-3">
              <a href="https://www.youtube.com/@akmcare1309" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Youtube size={16} />
              </a>
              <a href="https://wa.me/918200224226" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors">
                <MessageCircle size={16} />
              </a>
              <a href="https://www.facebook.com/share/1Jjs7ipP1x/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors" aria-label="AKM Care on Facebook">
                <Facebook size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-lg mb-4">Quick Links</h4>
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
            <h4 className="font-heading text-lg mb-4">Our Services</h4>
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
            <h4 className="font-heading text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-card/70">+91-8200224226</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-card/70">akmcare108@gmail.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-card/70">Ahmedabad, Gujarat, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-card/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-card/50">© 2025 AKM Care & AKM Freight. All Rights Reserved.</p>
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
