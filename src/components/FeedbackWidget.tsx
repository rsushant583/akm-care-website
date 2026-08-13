import { MessageCircle, Star } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { submitFeedback } from "@/lib/submissions";

export default function FeedbackWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !message.trim()) {
      toast.error("Please choose a rating and add a short message.");
      return;
    }

    setLoading(true);
    try {
      const result = await submitFeedback({
        name,
        rating,
        message,
        page: location.pathname,
      });

      if (!result.success) {
        toast.error("Could not submit feedback. Please try again.");
        return;
      }

      toast.success("Thank you for your feedback!");
      setOpen(false);
      setName("");
      setMessage("");
      setRating(0);
    } catch {
      toast.error("Could not submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onProductDetail = location.pathname.startsWith("/shop/product/");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed z-40 left-3 lg:left-auto lg:right-6 lg:bottom-6
          h-11 w-11 rounded-full bg-[#1A1A1A]/90 text-white shadow-md
          flex items-center justify-center
          hover:bg-[#1A1A1A] transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/50 focus-visible:ring-offset-2
          ${onProductDetail
            ? "bottom-[calc(8.25rem+env(safe-area-inset-bottom,0px))]"
            : "bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))]"}`}
        aria-label="Open feedback"
      >
        <MessageCircle size={18} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 card-shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-2xl mb-2">How was your experience on this page?</h3>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button type="button" key={value} onClick={() => setRating(value)} className="p-1">
                    <Star className={value <= rating ? "fill-primary text-primary" : "text-muted-foreground"} />
                  </button>
                ))}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us anything..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background resize-none"
                rows={4}
              />
              <button disabled={loading} type="submit" className="w-full rounded-full bg-primary text-primary-foreground py-3 font-semibold">
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
