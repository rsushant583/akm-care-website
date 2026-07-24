import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Global smooth scrolling. Stops on route change so Lenis never fights React Router.
 * Disabled when the user prefers reduced motion.
 */
export default function SmoothScroll() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  // Reset scroll position immediately on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}
