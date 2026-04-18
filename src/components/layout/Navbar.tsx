import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import logo from "@/assets/akm-logo.jpeg";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 12);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  const navSurface = isScrolled
    ? "backdrop-blur-md bg-white/85 shadow-sm border-b border-black/[0.06]"
    : "bg-transparent border-b border-transparent";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${navSurface}`}
      >
        <div
          className={`container-premium flex items-center justify-between mx-auto transition-[height] duration-300 ${
            isScrolled ? "h-[3.25rem] lg:h-14" : "h-14 lg:h-[4.25rem]"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 shrink-0 z-10">
            <img
              src={logo}
              alt="AKM Care"
              width={140}
              height={56}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className={`object-contain transition-all duration-300 ${isScrolled ? "h-9 lg:h-10" : "h-10 lg:h-12"}`}
            />
          </Link>

          <div className="hidden xl:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 2xl:gap-1 max-w-[min(72vw,52rem)]">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-2.5 2xl:px-3 py-2 text-[0.7rem] 2xl:text-[0.8rem] font-medium tracking-wide text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors whitespace-nowrap ${
                    active ? "text-[#1A1A1A]" : ""
                  }`}
                >
                  {link.label}
                  {active ? (
                    <span className="absolute left-2 right-2 bottom-1 h-0.5 rounded-full bg-[#E8621A]" />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 z-10">
            <Link
              to="/contact"
              className="hidden sm:inline-flex items-center px-4 py-2 lg:px-5 lg:py-2.5 rounded-full bg-[#E8621A] text-white text-xs lg:text-sm font-semibold shadow-md shadow-[#E8621A]/25 hover:brightness-105 transition-all"
            >
              Get In Touch
            </Link>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="xl:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-black/10 bg-white/70 text-[#1A1A1A] hover:bg-white"
                  aria-label="Open menu"
                >
                  <Menu size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw,22rem)] pt-12 bg-[#FAF8F5] border-l border-black/10">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle className="font-heading text-xl">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0.5" aria-label="Primary navigation drawer">
                  {navLinks.map((link) => {
                    const active = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`px-3 py-3.5 rounded-xl text-base font-medium border border-transparent ${
                          active
                            ? "bg-white text-[#E8621A] border-[#E8621A]/15 shadow-sm"
                            : "text-[#1A1A1A]/85 hover:bg-white/80"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <Link
                    to="/contact"
                    className="mt-4 text-center px-5 py-3.5 rounded-full bg-[#E8621A] text-white font-semibold shadow-md"
                  >
                    Get In Touch
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
}
