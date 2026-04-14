import type { CarouselSlide } from "./carouselTypes";

/**
 * Homepage slideshow — client-provided images (see /public/slides/slide-home-*.png).
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
    title: "Our Objective — Pan-India training and services",
    subtitle: "AKM Care serves and provides industrial training, placement, manpower, tours & travel, and related solutions across India.",
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
    title: "Corporate Social Responsibility",
    subtitle: "CSR program — free training and community support initiatives",
    image: "/slides/slide-home-05-csr.png",
    theme: "brand",
  },
];
