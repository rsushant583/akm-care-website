export type DailyQuote = { quote: string; source: string };

const baseQuotes: DailyQuote[] = [
  { quote: "Small daily improvements create extraordinary long-term results.", source: "AKM Care" },
  { quote: "Discipline in action builds confidence in outcomes.", source: "AKM Care" },
  { quote: "Do the work with integrity; success follows quietly.", source: "AKM Care" },
  { quote: "Consistency turns effort into excellence.", source: "AKM Care" },
  { quote: "Clarity, then commitment, then execution.", source: "AKM Care" },
  { quote: "Your attitude at work shapes your future faster than luck.", source: "AKM Care" },
  { quote: "One focused hour is better than a day of distraction.", source: "AKM Care" },
  { quote: "Respect people, honor time, and deliver quality.", source: "AKM Care" },
  { quote: "Progress is built in routines, not in random bursts.", source: "AKM Care" },
  { quote: "The right process reduces stress and increases trust.", source: "AKM Care" },
  { quote: "Stay humble, stay prepared, and stay dependable.", source: "AKM Care" },
  { quote: "Every professional day is a chance to become sharper.", source: "AKM Care" },
  { quote: "Strong teams are created by clear communication.", source: "AKM Care" },
  { quote: "Work with purpose, not pressure.", source: "AKM Care" },
  { quote: "When values guide decisions, growth becomes sustainable.", source: "AKM Care" },
];

export const dailyQuotes: DailyQuote[] = Array.from({ length: 365 }, (_, i) => {
  const q = baseQuotes[i % baseQuotes.length];
  return { quote: q.quote, source: q.source };
});
