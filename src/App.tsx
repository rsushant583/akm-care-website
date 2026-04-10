import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/Layout";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<div style={{ height: "100vh" }}></div>}>
              <Routes>
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
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
