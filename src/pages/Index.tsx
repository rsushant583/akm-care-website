import Hero from "@/components/home/Hero";
import ImageCarousel from "@/components/home/ImageCarousel";
import StatsBar from "@/components/home/StatsBar";
import ServicesOverview from "@/components/home/ServicesOverview";
import DailyMotivation from "@/components/home/DailyMotivation";
import YouTubeCarousel from "@/components/home/YouTubeCarousel";
import EcommercePreview from "@/components/home/EcommercePreview";
import FAQPreview from "@/components/home/FAQPreview";
import CTABanner from "@/components/home/CTABanner";
import { SEO } from "@/components/SEO";
import { organizationSchema } from "@/lib/schemas";

export default function Index() {
  return (
    <>
      <SEO
        title="Industrial Training, HR & Rural E-Commerce"
        description="AKM Care — India's trusted platform for industrial training, placement, manpower, compliance consulting, and authentic village products. Pan-India operations."
        keywords="industrial training India, HR services Ahmedabad, manpower deployment, compliance consulting, makhana buy online, sattu powder buy, rural products India, AKM Care"
        canonical="/"
        schema={organizationSchema}
      />
      <Hero />
      <ImageCarousel />
      <StatsBar />
      <ServicesOverview />
      <DailyMotivation />
      <YouTubeCarousel />
      <EcommercePreview />
      <FAQPreview />
      <CTABanner />
    </>
  );
}
