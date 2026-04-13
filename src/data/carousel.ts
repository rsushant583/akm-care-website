import type { CarouselSlide } from "./carouselTypes";

/** Homepage wisdom carousel — Gita first; brand message is typography (no plain text image). */
export const carouselSlides: CarouselSlide[] = [
  {
    kind: "image",
    title: "Bhagavad Gita — Chapter II, Verse 47",
    subtitle: "Sanskrit verse with English translation on duty and non-attachment to outcomes",
    image: "/slides/slide-bhagavad-gita-ch2-v47.png",
    theme: "wisdom",
  },
  {
    kind: "message",
    title: "AKM Care & AKM Freight",
    subtitle: "One platform · Ethics · Integrity",
    body: "AKM Care and AKM Freight (a milestone for training industry, HR, sales & marketing, logistics, other industrial requirements and e‑commerce services) provide all solutions on a single platform with ethics and integrity within a benchmarking value frame.",
    theme: "brand",
    epigraph: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
    epigraphTranslation: "Your right is to your duty — not to the fruits alone.",
  },
  {
    kind: "image",
    title: "Humanity and CSR",
    subtitle: "Community impact",
    image: "/slides/slide-csr.png",
    theme: "humanity",
  },
  {
    kind: "image",
    title: "Industry and Services",
    subtitle: "Industrial support",
    image: "/slides/slide-services.png",
    theme: "industry",
  },
  {
    kind: "image",
    title: "Growth and Environment",
    subtitle: "Sustainable progress",
    image: "/slides/slide-objective.png",
    theme: "environment",
  },
];
