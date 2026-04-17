import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "@/assets/akm-logo.jpeg";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Training & Education", path: "/training" },
  { label: "Services", path: "/services" },
  { label: "Shop", path: "/shop" },
  { label: "Media", path: "/media" },
  { label: "CSR", path: "/csr" },
  { label: "Careers", path: "/careers" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? "bg-background/85 backdrop-blur-2xl shadow-[0_10px_40px_rgba(10,10,10,0.06)] border-border/60"
            : "bg-background/70 backdrop-blur-xl border-transparent"
        }`}
      >
        <div className="container-premium flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="AKM Care" width={140} height={56} loading="eager" className="h-12 lg:h-14 object-contain" />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:block">
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:brightness-105 hover:-translate-y-0.5 transition-all duration-500 ease-in-out"
            >
              Get In Touch
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-card transition-all duration-300 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="pt-20 px-6 flex flex-col gap-1">
          {navLinks.map((link, i) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-3.5 text-lg font-medium rounded-xl transition-all ${
                location.pathname === link.path
                  ? "text-primary bg-accent"
                  : "text-foreground hover:bg-muted"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="mt-4 text-center px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-lg"
          >
            Get In Touch
          </Link>
        </div>
      </div>
    </>
  );
}
