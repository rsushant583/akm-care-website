import { lazy, Suspense } from "react";
import EcommercePreview from "@/components/home/EcommercePreview";
import { SEO } from "@/components/SEO";
import { organizationSchema } from "@/lib/schemas";

const ServicesOverview = lazy(() => import("@/components/home/ServicesOverview"));
const StatsBar = lazy(() => import("@/components/home/StatsBar"));
const ImageCarousel = lazy(() => import("@/components/home/ImageCarousel"));
const YouTubeCarousel = lazy(() => import("@/components/home/YouTubeCarousel"));
const FAQPreview = lazy(() => import("@/components/home/FAQPreview"));
const CTABanner = lazy(() => import("@/components/home/CTABanner"));

function BelowFoldFallback() {
  return <div className="py-6" aria-hidden />;
}

export default function Index() {
  return (
    <>
      <SEO
        title="Shop Authentic Fashion Online"
        description="Shop sarees, lehengas, gowns, suits and jeans on AKM Care — authentic products with pan-India delivery. Also industrial training, HR solutions, CSR and more."
        keywords="AKM Care shop, buy sarees online, lehenga online, ladies gown, 3 piece suits, mens jeans, makhana, sattu, industrial training India, HR services Ahmedabad"
        canonical="/"
        schema={organizationSchema}
      />
      <EcommercePreview />
      <Suspense fallback={<BelowFoldFallback />}>
        <ServicesOverview />
        <StatsBar />
        <ImageCarousel />
        <YouTubeCarousel />
        <FAQPreview />
        <CTABanner />
      </Suspense>
    </>
  );
}
