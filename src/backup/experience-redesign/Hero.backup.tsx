import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

export default function Hero() {
  return (
    <section className="relative min-h-[92vh] lg:min-h-screen flex items-center overflow-hidden grain-overlay">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(25_95%_53%/0.18),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-saffron-light/40 via-background to-background" />
      <div className="absolute top-24 right-[10%] w-[420px] h-[420px] rounded-full bg-primary/[0.07] blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-[5%] w-[320px] h-[320px] rounded-full bg-amber-400/10 blur-3xl animate-pulse" />

      <div className="container-premium relative z-10 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="max-w-xl">
            <Reveal>
              <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-2xl bg-card/60 backdrop-blur-xl border border-primary/10 shadow-lg shadow-primary/5 mb-8">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(25_95%_53%)]" />
                  <span className="text-sm font-semibold text-foreground">Pan-India · Ethics first</span>
                </div>
                <span className="hidden sm:block h-4 w-px bg-border" aria-hidden />
                <span className="text-xs text-muted-foreground font-medium tracking-wide">
                  कर्मण्येवाधिकारस्ते
                </span>
              </div>
            </Reveal>

            <Reveal delayMs={100}>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-[3.8rem] leading-[1.03] mb-6 tracking-tight" style={{ textWrap: "balance" }}>
                One Platform For All Solutions.
              </h1>
            </Reveal>

            <Reveal delayMs={180}>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-md">
                Built with the discipline of duty and the warmth of dharma — solutions that scale with your values.
              </p>
            </Reveal>

            <Reveal delayMs={260}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-105 hover:-translate-y-0.5 transition-all duration-500 ease-in-out"
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
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
