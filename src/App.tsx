import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";

const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Training = lazy(() => import("./pages/Training"));
const Services = lazy(() => import("./pages/Services"));
const Shop = lazy(() => import("./pages/Shop"));
const Media = lazy(() => import("./pages/Media"));
const Motivation = lazy(() => import("./pages/Motivation"));
const CSR = lazy(() => import("./pages/CSR"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef(true);

  useLayoutEffect(() => {
    if (bootRef.current) return;
    if (location.pathname === displayLocation.pathname && location.search === displayLocation.search) return;

    const wrap = wrapperRef.current;
    if (!wrap) {
      setDisplayLocation(location);
      return;
    }

    if (prefersReducedMotion()) {
      window.scrollTo(0, 0);
      setDisplayLocation(location);
      return;
    }

    gsap.killTweensOf(wrap);
    gsap.to(wrap, {
      opacity: 0,
      scale: 0.98,
      duration: 0.45,
      ease: "power2.in",
      onComplete: () => {
        window.scrollTo(0, 0);
        setDisplayLocation(location);
      },
    });
  }, [location, displayLocation]);

  useLayoutEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;

    if (bootRef.current) {
      bootRef.current = false;
      gsap.set(wrap, { opacity: 1, scale: 1, y: 0 });
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(wrap, { opacity: 1, scale: 1, y: 0 });
      return;
    }

    gsap.killTweensOf(wrap);
    gsap.fromTo(
      wrap,
      { opacity: 0, y: 20, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.52, ease: "power3.out" },
    );
  }, [displayLocation]);

  return (
    <div
      ref={wrapperRef}
      data-route-transition-root
      className="flex-1 w-full will-change-[opacity,transform]"
    >
      <Suspense fallback={<div className="min-h-[100vh]" aria-hidden />}>
        <Routes location={displayLocation}>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/training" element={<Training />} />
          <Route path="/services" element={<Services />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/media" element={<Media />} />
          <Route path="/motivation" element={<Motivation />} />
          <Route path="/csr" element={<CSR />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <AnimatedRoutes />
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
