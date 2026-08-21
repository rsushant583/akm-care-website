import { lazy, Suspense } from "react";
import EcommercePreview from "@/components/home/EcommercePreview";
import { SEO } from "@/components/SEO";
import { organizationSchema, websiteSchema } from "@/lib/schemas";
import { HOME_SEO } from "@/data/seoPages";

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
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        canonical="/"
        schema={[organizationSchema, websiteSchema]}
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
