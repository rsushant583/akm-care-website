import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import GlobalMotivationLayer from "./GlobalMotivationLayer";
import FeedbackWidget from "@/components/FeedbackWidget";
import { enablePremiumUI } from "@/config/uiMode";
import SmoothScroll from "./SmoothScroll";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FAF8F5] overflow-x-hidden ${enablePremiumUI ? "ambient-gradient" : ""}`}
    >
      <SmoothScroll />
      <Navbar />
      <GlobalMotivationLayer />
      <main className="flex-1 flex flex-col pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:pt-[calc(4.25rem+env(safe-area-inset-top,0px))] relative min-h-0 pb-[max(4rem,calc(4rem+env(safe-area-inset-bottom,0px)))] lg:pb-0">
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(232,98,26,0.06),transparent_55%)]"
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
