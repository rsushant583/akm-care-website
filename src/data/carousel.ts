import type { CarouselSlide } from "./carouselTypes";

/**
 * Homepage slideshow — only the five client-provided images (see /public/slides/slide-home-*.png).
 */
export const carouselSlides: CarouselSlide[] = [
  {
    title: "Bhagavad Gita — Chapter II, Verse 47",
    subtitle: "Sanskrit verse with English translation on duty and non-attachment to outcomes",
    image: "/slides/slide-home-01-gita.png",
    theme: "wisdom",
  },
  {
    title: "Our Synopsis — education, training, services, compliance",
    subtitle: "Upanishadic vision: from darkness to light; AKM Care identity and quadrants",
    image: "/slides/slide-home-02-synopsis.png",
    theme: "brand",
  },
  {
    title: "Our Objective — MSME firm, Pan-India training and services",
    subtitle: "Industrial trainings, placement, manpower, tours & travel, Gujarat and India",
    image: "/slides/slide-home-03-objective.png",
    theme: "industry",
  },
  {
    title: "AKM Care & AKM Freight — milestone and platform",
    subtitle: "Training, HR, sales & marketing, logistics, e-commerce — ethics and integrity",
    image: "/slides/slide-home-04-brand-message.png",
    theme: "brand",
  },
  {
    title: "Founder — Bimleshkumar Bibhakar",
    subtitle: "AKM Care & AKM Freight Carriers; corporate trainer and former HR professional",
    image: "/slides/slide-home-05-founder.png",
    theme: "team",
  },
];
