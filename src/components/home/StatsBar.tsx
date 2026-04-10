import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useState } from "react";

const stats = [
  { value: 500, suffix: "+", label: "Industries Served" },
  { value: 10000, suffix: "+", label: "Professionals Trained" },
  { value: 15, suffix: "+", label: "Service Verticals" },
  { value: 0, suffix: "", label: "Pan India Reach", display: "Pan India" },
];

function CountUp({ target, suffix, display }: { target: number; suffix: string; display?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollAnimation();

  useEffect(() => {
    if (!isVisible || display) return;
    let current = 0;
    const duration = 1500;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, display]);

  return (
    <div ref={ref} className="font-heading text-3xl sm:text-4xl lg:text-5xl text-primary mb-1">
      {display || `${count.toLocaleString()}${suffix}`}
    </div>
  );
}

export default function StatsBar() {
  return (
    <section className="section-padding">
      <div className="container-premium">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <CountUp target={stat.value} suffix={stat.suffix} display={stat.display} />
              <div className="text-sm sm:text-base text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
