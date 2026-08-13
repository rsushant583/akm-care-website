import { useDailyQuote } from "@/context/DailyQuoteContext";
import { Link } from "react-router-dom";

/**
 * Brand personality section — secondary to shopping.
 * Replaces the old fixed header ticker that clipped under the nav.
 */
export default function DailyMotivation() {
  const quote = useDailyQuote();
  if (!quote) return null;

  return (
    <section
      className="border-y border-black/[0.04] bg-[#FAF8F5]"
      aria-labelledby="thought-of-the-day-heading"
    >
      <div className="container-premium py-10 sm:py-12 lg:py-14">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#E8621A] mb-3">
            AKM Care spirit
          </p>
          <h2 id="thought-of-the-day-heading" className="type-section mb-6">
            Thought of the day
          </h2>
          <blockquote className="font-heading text-xl sm:text-2xl leading-relaxed text-[#1A1A1A] mb-4">
            “{quote.text}”
          </blockquote>
          <p className="type-meta text-sm mb-6">— {quote.author}</p>
          <Link to="/motivation" className="btn-tertiary">
            Explore Motivation
          </Link>
        </div>
      </div>
    </section>
  );
}
