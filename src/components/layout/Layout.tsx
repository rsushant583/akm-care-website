import type { CSSProperties, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import FeedbackWidget from "@/components/FeedbackWidget";
import YogaDayCelebration from "@/components/layout/YogaDayCelebration";
import { enablePremiumUI } from "@/config/uiMode";
import SmoothScroll from "./SmoothScroll";
import { DailyQuoteProvider } from "@/context/DailyQuoteContext";
import { CompareTray, FloatingCart } from "@/components/shop";
import GlobalMotivationLayer from "./GlobalMotivationLayer";

/**
 * Storefront shell.
 * Motivation/quote lives in page sections (e.g. DailyMotivation) — not a fixed ticker under the nav,
 * which previously caused top-of-viewport clipping behind the header.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const showHomeMarquee = pathname === "/";

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <DailyQuoteProvider>
      <div
        style={
          {
            "--motivation-height": showHomeMarquee ? "2.25rem" : "0px",
          } as CSSProperties
        }
        className={`min-h-screen flex flex-col bg-[#FAF8F5] overflow-x-hidden ${enablePremiumUI ? "ambient-gradient" : ""}`}
      >
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <SmoothScroll />
        {showHomeMarquee ? <GlobalMotivationLayer /> : null}
        <Navbar />
        <main
          id="main-content"
          className="flex-1 flex flex-col mobile-nav-pad relative min-h-0"
          style={{
            paddingTop:
              "calc(var(--nav-height) + var(--motivation-height, 0px) + env(safe-area-inset-top, 0px))",
          }}
        >
          <div
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(232,98,26,0.05),transparent_55%)]"
            aria-hidden
          />
          {children}
        </main>
        <Footer />
        <MobileNav />
        <FloatingCart />
        <CompareTray />
        <FeedbackWidget />
        <YogaDayCelebration />
      </div>
    </DailyQuoteProvider>
  );
}
