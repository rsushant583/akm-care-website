import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { Ga4RouteTracker } from "@/lib/analytics/ga4";

import Index from "./pages/Index";
const About = lazy(() => import("./pages/About"));
const Training = lazy(() => import("./pages/Training"));
const Services = lazy(() => import("./pages/Services"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AccountLayout = lazy(() => import("./components/account/AccountLayout"));
const AccountOverview = lazy(() => import("./pages/account/AccountOverview"));
const AccountOrders = lazy(() => import("./pages/account/AccountOrders"));
const AccountOrderDetail = lazy(() => import("./pages/account/AccountOrderDetail"));
const AccountWishlist = lazy(() => import("./pages/account/AccountWishlist"));
const AccountAddresses = lazy(() => import("./pages/account/AccountAddresses"));
const AccountProfile = lazy(() => import("./pages/account/AccountProfile"));
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
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const ShippingReturns = lazy(() => import("./pages/ShippingReturns"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideSareeLength = lazy(() => import("./pages/GuideSareeLength"));
const AdminRoutes = lazy(() => import("./pages/admin/AdminRoutes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-[50vh] flex flex-col items-center justify-center gap-3 bg-[#FAF8F5] text-[#6B6B6B]"
          role="status"
          aria-live="polite"
        >
          <span className="h-9 w-9 rounded-full border-2 border-[#E8621A]/30 border-t-[#E8621A] animate-spin" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/training" element={<Training />} />
        <Route path="/services" element={<Services />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/product/:slug" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <RouteErrorBoundary title="Checkout problem">
              <Checkout />
            </RouteErrorBoundary>
          }
        />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountOverview />} />
          <Route path="orders" element={<AccountOrders />} />
          <Route path="orders/:id" element={<AccountOrderDetail />} />
          <Route path="wishlist" element={<AccountWishlist />} />
          <Route path="addresses" element={<AccountAddresses />} />
          <Route path="profile" element={<AccountProfile />} />
        </Route>
        <Route path="/sell-your-product" element={<SellYourProduct />} />
        <Route path="/personal-booking" element={<PersonalBooking />} />
        <Route path="/media" element={<Media />} />
        <Route path="/motivation" element={<Motivation />} />
        <Route path="/csr" element={<CSR />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guides/saree-length" element={<GuideSareeLength />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/shipping-returns" element={<ShippingReturns />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <RecentlyViewedProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <ScrollToTop />
                      <Ga4RouteTracker />
                      <Layout>
                        <AppRoutes />
                      </Layout>
                    </BrowserRouter>
                  </RecentlyViewedProvider>
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
