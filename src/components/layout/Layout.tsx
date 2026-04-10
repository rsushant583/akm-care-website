import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import FeedbackWidget from "@/components/FeedbackWidget";

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 lg:pt-20">{children}</main>
      <Footer />
      <MobileNav />
      <FeedbackWidget />
    </div>
  );
}
