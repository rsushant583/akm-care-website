import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-saffron-light/50 via-background to-background" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-200/20 rounded-full blur-3xl" />

      <div className="container-premium relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/10 mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-accent-foreground">Trusted by Industries Across India</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] mb-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
              One Platform.{" "}
              <span className="text-gradient-saffron">Every Solution.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: "200ms" }}>
              Training. Logistics. HR. E-Commerce — Delivered with Ethics and Excellence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "300ms" }}>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 hover:scale-[1.02] transition-all"
              >
                Explore Services <ArrowRight size={18} />
              </Link>
              <a
                href="https://www.youtube.com/@akmcare1309"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-border text-foreground font-semibold text-base hover:bg-muted transition-all"
              >
                <Play size={18} className="text-primary" /> Watch Our Story
              </a>
            </div>
          </div>

          {/* Abstract geometric */}
          <div className="hidden lg:flex items-center justify-center animate-fade-up" style={{ animationDelay: "400ms" }}>
            <div className="relative w-[420px] h-[420px]">
              <div className="absolute top-0 right-8 w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-300/20 rotate-12" />
              <div className="absolute top-16 left-0 w-56 h-56 rounded-full border-[3px] border-primary/15" />
              <div className="absolute bottom-8 right-0 w-40 h-40 rounded-2xl bg-gradient-to-tr from-primary to-amber-400 opacity-80" />
              <div className="absolute bottom-20 left-12 w-32 h-32 rounded-full bg-amber-200/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              {/* Growth lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 420">
                <line x1="60" y1="350" x2="200" y2="200" stroke="hsl(25 95% 53% / 0.15)" strokeWidth="2" />
                <line x1="200" y1="200" x2="340" y2="100" stroke="hsl(25 95% 53% / 0.15)" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
