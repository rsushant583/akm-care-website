import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import FeedbackWidget from "@/components/FeedbackWidget";
import { enablePremiumUI } from "@/config/uiMode";

export default function LayoutBackup({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={`min-h-screen flex flex-col bg-background ${enablePremiumUI ? "ambient-gradient" : ""}`}>
      <Navbar />
      <main className="flex-1 pt-16 lg:pt-20 relative">
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,hsl(25_95%_53%/0.06),transparent_55%)]"
          aria-hidden
        />
        {children}
      </main>
      <Footer />
      <MobileNav />
      <FeedbackWidget />
    </div>
  );
}
