import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";

type HeadlineRevealProps = {
  children: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
};

/**
 * Word-by-word fade-up for section headings (ScrollTrigger + GSAP).
 */
export function HeadlineReveal({ children, as: Tag = "h2", className }: HeadlineRevealProps) {
  const rootRef = useRef<HTMLHeadingElement | HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const words = root.querySelectorAll<HTMLElement>("[data-word]");
    if (!words.length) return;

    if (prefersReducedMotion()) {
      gsap.set(words, { clearProps: "all", opacity: 1, y: 0 });
      return;
    }

    gsap.set(words, { opacity: 0, y: "0.55em" });
    const ctx = gsap.context(() => {
      gsap.to(words, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.045,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root,
          start: "top 88%",
          once: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, [children]);

  const words = children.split(/\s+/).filter(Boolean);

  return (
    <Tag ref={rootRef} className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          {i > 0 ? "\u00A0" : null}
          <span data-word className="inline-block">
            {word}
          </span>
        </span>
      ))}
    </Tag>
  );
}
