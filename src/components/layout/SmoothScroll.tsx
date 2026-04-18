import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Global smooth scrolling. Disabled when the user prefers reduced motion.
 */
export default function SmoothScroll() {
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

  return null;
}
