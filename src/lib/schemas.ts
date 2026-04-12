export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AKM Care & AKM Freight",
  alternateName: "AKM Care",
  url: "https://akmcare.com",
  logo: "https://akmcare.com/logo.png",
  description:
    "Industrial training, HR solutions, logistics, compliance consulting and rural e-commerce platform serving pan-India.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ahmedabad",
    addressRegion: "Gujarat",
    addressCountry: "IN",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
  ],
  sameAs: ["https://www.youtube.com/@akmcare1309"],
  areaServed: "IN",
  foundingLocation: "Ahmedabad, Gujarat, India",
};

export const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Industrial Training & HR Solutions",
  provider: {
    "@type": "Organization",
    name: "AKM Care & AKM Freight",
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "AKM Care Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Industrial Training" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Placement Services" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Manpower Deployment" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Logistics & Freight" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Compliance Consulting" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Employment Verification" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "IT Solutions — Web, Apps & Software" } },
    ],
  },
};

export const faqSchema = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `https://akmcare.com${item.url}`,
  })),
});
