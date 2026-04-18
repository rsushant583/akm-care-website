import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsapRegister";
import { prefersReducedMotion } from "@/lib/motion";
import { runRevealWhenVisible } from "@/lib/runRevealWhenVisible";

const stats = [
  { value: 500, suffix: "+", label: "Industries Served" },
  { value: 10000, suffix: "+", label: "Professionals Trained" },
  { value: 15, suffix: "+", label: "Service Verticals" },
  { value: 0, suffix: "", label: "Pan India Reach", display: "Pan India" },
];

export default function StatsBar() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      stats.forEach((stat, i) => {
        const item = root.querySelectorAll("[data-stat-item]")[i];
        const el = item?.querySelector("[data-stat-value]");
        if (el && stat.display) el.textContent = stat.display;
        else if (el) el.textContent = `${stat.value.toLocaleString()}${stat.suffix}`;
      });
      return;
    }

    let ctx: gsap.Context | null = null;
    const disconnect = runRevealWhenVisible(root, () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-stat-item]"));

        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
        });

        items.forEach((item, i) => {
          const valueEl = item.querySelector<HTMLElement>("[data-stat-value]");
          if (!valueEl) return;

          const target = Number(valueEl.dataset.target ?? "0");
          const suffix = valueEl.dataset.suffix ?? "";
          const display = valueEl.dataset.display;

          tl.from(
            valueEl,
            { scale: 0.88, opacity: 0.5, duration: 0.55, ease: "back.out(1.35)" },
            i * 0.06,
          );

          if (display) {
            valueEl.textContent = display;
            return;
          }

          const proxy = { n: 0 };
          tl.to(
            proxy,
            {
              n: target,
              duration: 2.1,
              ease: "power2.out",
              onUpdate: () => {
                valueEl.textContent = `${Math.round(proxy.n).toLocaleString("en-IN")}${suffix}`;
              },
            },
            i * 0.06,
          );
        });

        tl.play(0);
      }, root);
    });

    return () => {
      disconnect();
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="section-padding">
      <div className="container-premium">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} data-stat-item className="text-center">
              <div
                data-stat-value
                data-target={stat.value}
                data-suffix={stat.suffix}
                data-display={stat.display ?? ""}
                className="font-heading text-3xl sm:text-4xl lg:text-5xl text-primary mb-1 tabular-nums"
              >
                {stat.display ?? `0${stat.suffix}`}
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
