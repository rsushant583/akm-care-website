import { Quote } from "lucide-react";
import { useMotivation } from "@/hooks/useMotivation";
import { Skeleton } from "@/components/ui/skeleton";

export default function DailyMotivation() {
  const { data: motivationQuotes, loading } = useMotivation();
  const quote = motivationQuotes[0];

  return (
    <section className="section-padding">
      <div className="container-premium">
        <h2 className="font-heading text-3xl sm:text-4xl text-center mb-10">
          Today's Inspiration
        </h2>

        {loading || !quote ? (
          <Skeleton className="max-w-3xl mx-auto h-56 rounded-2xl" />
        ) : (
        <div className="max-w-3xl mx-auto bg-warm-beige rounded-2xl p-8 sm:p-12 card-shadow text-center">
          <Quote size={40} className="text-primary/30 mx-auto mb-4" />
          <blockquote className="font-heading text-xl sm:text-2xl lg:text-3xl italic leading-relaxed mb-6 text-foreground">
            "{quote.quote}"
          </blockquote>
          <p className="text-muted-foreground font-medium">— {quote.source}</p>
        </div>
        )}
      </div>
    </section>
  );
}
