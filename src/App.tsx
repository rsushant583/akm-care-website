import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Training = lazy(() => import("./pages/Training"));
const Services = lazy(() => import("./pages/Services"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Account = lazy(() => import("./pages/Account"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PersonalBooking = lazy(() => import("./pages/PersonalBooking"));
const Media = lazy(() => import("./pages/Media"));
const Motivation = lazy(() => import("./pages/Motivation"));
const CSR = lazy(() => import("./pages/CSR"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const SellYourProduct = lazy(() => import("./pages/SellYourProduct"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(location.pathname + location.search);

  useLayoutEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;

    const key = location.pathname + location.search;
    const isFirst = prevPathRef.current === key && wrap.style.opacity === "";
    prevPathRef.current = key;

    if (prefersReducedMotion()) {
      gsap.set(wrap, { opacity: 1, scale: 1, y: 0 });
      window.scrollTo(0, 0);
      return;
    }

    window.scrollTo(0, 0);
    gsap.killTweensOf(wrap);
    if (isFirst) {
      gsap.set(wrap, { opacity: 1, scale: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      wrap,
      { opacity: 0.35, y: 12, scale: 0.995 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: "power3.out",
        onComplete: () => {
          try {
            ScrollTrigger.refresh();
          } catch {
            /* ignore */
          }
        },
      },
    );
  }, [location]);

  return (
    <div
      ref={wrapperRef}
      data-route-transition-root
      className="flex-1 w-full will-change-[opacity,transform]"
    >
      <Suspense
        fallback={
          <div
            className="min-h-[100vh] flex flex-col items-center justify-center gap-3 bg-[#FAF8F5] text-[#6B6B6B]"
            role="status"
            aria-live="polite"
          >
            <span className="h-9 w-9 rounded-full border-2 border-[#E8621A]/30 border-t-[#E8621A] animate-spin" />
            <span className="text-sm font-medium">Loading…</span>
          </div>
        }
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/training" element={<Training />} />
          <Route path="/services" element={<Services />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route path="/sell-your-product" element={<SellYourProduct />} />
          <Route path="/personal-booking" element={<PersonalBooking />} />
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
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <RecentlyViewedProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <Layout>
                      <AnimatedRoutes />
                    </Layout>
                  </BrowserRouter>
                </RecentlyViewedProvider>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
