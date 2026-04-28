import { createContext, ReactNode, useContext, useMemo } from "react";
import { getDailyQuote } from "@/utils/getDailyQuote";

type DailyQuote = {
  text: string;
  author: string;
  greeting: string;
};

const DailyQuoteContext = createContext<DailyQuote | null>(null);

export function DailyQuoteProvider({ children }: { children: ReactNode }) {
  const quote = useMemo(() => getDailyQuote(), []);
  return <DailyQuoteContext.Provider value={quote}>{children}</DailyQuoteContext.Provider>;
}

export function useDailyQuote() {
  return useContext(DailyQuoteContext);
}
