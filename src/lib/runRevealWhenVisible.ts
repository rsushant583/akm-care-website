/**
 * Runs `onReveal` once when `element` intersects the viewport (including the
 * initial synchronous callback when the element is already visible).
 * Avoids ScrollTrigger + layout timing issues common in production SPAs.
 */
export function runRevealWhenVisible(
  element: HTMLElement,
  onReveal: () => void,
  init?: IntersectionObserverInit,
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    queueMicrotask(onReveal);
    return () => {};
  }

  let done = false;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || done) continue;
        done = true;
        io.disconnect();
        requestAnimationFrame(() => {
          onReveal();
        });
        break;
      }
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px 15% 0px",
      ...init,
    },
  );

  io.observe(element);
  return () => {
    done = true;
    io.disconnect();
  };
}
