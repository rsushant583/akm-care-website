import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "@/assets/akm-logo.jpeg";
import { AnimatePresence, motion } from "framer-motion";
import { easeOut } from "@/lib/animations";

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          isScrolled
            ? "bg-white/95 backdrop-blur-[24px] shadow-[0_1px_0_rgba(0,0,0,0.05),0_4px_24px_rgba(0,0,0,0.04)] border-black/10"
            : "bg-[rgba(253,250,247,0.85)] backdrop-blur-[24px] border-black/5"
        }`}
      >
        <div className="container-premium flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-center gap-2 shrink-0 rounded-full bg-white/70 px-3 py-1">
            <img src={logo} alt="AKM Care" width={140} height={56} loading="eager" className="h-[42px] object-contain" />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative py-2 text-sm font-normal tracking-[0.01em] transition-colors ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-[#4B4B4B] hover:text-primary"
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute -bottom-[7px] left-0 right-0 h-0.5 bg-primary origin-center"
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden lg:block">
            <Link
              to="/contact"
              className="inline-flex items-center px-[22px] py-[10px] rounded-full bg-[#0A0A0A] text-white text-[13px] font-medium hover:bg-primary hover:-translate-y-[1px] transition-all duration-300"
            >
              Get In Touch
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-black/5 min-w-11 min-h-11"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-[hsl(40_50%_96%)] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
          >
            <div className="pt-24 px-6 flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.48, ease: easeOut }}
                >
                  <Link
                    to={link.path}
                    className={`block px-4 py-3 text-[32px] font-light font-['Cormorant_Garamond'] rounded-xl ${
                      location.pathname === link.path ? "text-primary" : "text-[#111]"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                to="/contact"
                className="mt-5 text-center px-6 py-3.5 rounded-full bg-[#0A0A0A] text-white font-medium text-base"
              >
                Get In Touch
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
