import { useEffect, useState } from "react";
import { getIndiaDateKey, msUntilNextIndiaMidnight } from "@/lib/dailyMotivation";

export function useIndiaDayKey() {
  const [dayKey, setDayKey] = useState(() => getIndiaDateKey());

  useEffect(() => {
    const refresh = () => {
      setDayKey((prev) => {
        const next = getIndiaDateKey();
        return prev === next ? prev : next;
      });
    };

    const timeoutId = window.setTimeout(refresh, msUntilNextIndiaMidnight());
    const intervalId = window.setInterval(refresh, 60_000);

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [dayKey]);

  return dayKey;
}
