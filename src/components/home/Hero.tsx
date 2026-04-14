import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[92vh] lg:min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(25_95%_53%/0.18),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-saffron-light/40 via-background to-background" />
      <div className="absolute top-24 right-[10%] w-[420px] h-[420px] rounded-full bg-primary/[0.07] blur-3xl" />
      <div className="absolute bottom-20 left-[5%] w-[320px] h-[320px] rounded-full bg-amber-400/10 blur-3xl" />

      <div className="container-premium relative z-10 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="max-w-xl">
            <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-2xl bg-card/60 backdrop-blur-xl border border-primary/10 shadow-lg shadow-primary/5 mb-8 animate-fade-up">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(25_95%_53%)]" />
                <span className="text-sm font-semibold text-foreground">Pan-India · Ethics first</span>
              </div>
              <span className="hidden sm:block h-4 w-px bg-border" aria-hidden />
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                कर्मण्येवाधिकारस्ते
              </span>
            </div>

            <h1
              className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-[3.5rem] leading-[1.06] mb-6 animate-fade-up tracking-tight"
              style={{ animationDelay: "80ms", textWrap: "balance" }}
            >
              One Platform For All Solutions.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 animate-fade-up max-w-md" style={{ animationDelay: "160ms" }}>
              Built with the discipline of duty and the warmth of dharma — solutions that scale with your values.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "240ms" }}>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-105 hover:-translate-y-0.5 transition-all duration-300"
              >
                Explore Services <ArrowRight size={18} />
              </Link>
              <a
                href="https://www.youtube.com/@akmcare1309"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-border/80 bg-card/50 backdrop-blur-md text-foreground font-semibold text-base hover:bg-card hover:border-primary/25 transition-all duration-300"
              >
                <Play size={18} className="text-primary" /> Watch our story
              </a>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center animate-fade-up" style={{ animationDelay: "320ms" }}>
            <div className="relative w-[min(100%,440px)] aspect-square">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/20 via-amber-200/10 to-transparent blur-2xl scale-110" />
              <div className="relative h-full rounded-[2rem] border border-white/40 bg-card/40 backdrop-blur-2xl shadow-2xl shadow-black/10 p-10 flex flex-col justify-center ring-1 ring-primary/10">
                <p className="font-heading text-2xl text-foreground/90 leading-snug mb-4">
                  “You have the right to work, not to the fruits of work alone.”
                </p>
                <p className="text-sm text-primary font-semibold tracking-wide mb-6">— Bhagavad Gita, 2:47</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                    <p className="text-2xl font-heading text-primary mb-1">Training</p>
                    <p className="text-muted-foreground leading-tight">Soft skills, technical & compliance programs</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 border border-border/60 p-4">
                    <p className="text-2xl font-heading text-foreground mb-1">Logistics</p>
                    <p className="text-muted-foreground leading-tight">AKM Freight — reliable movement of goods</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-amber-500 opacity-90 shadow-lg -z-10 rotate-6" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full border-2 border-primary/20 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
