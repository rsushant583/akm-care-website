import { Bus, ExternalLink, Plane, ShoppingBag, TrainFront, type LucideIcon } from "lucide-react";
import { SEO } from "@/components/SEO";

const services: {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconClass: string;
}[] = [
  {
    name: "IRCTC",
    description: "Indian Railways ticketing and travel services.",
    href: "https://www.irctc.co.in/",
    icon: TrainFront,
    iconClass: "text-[#1A73A6] bg-[#1A73A6]/10",
  },
  {
    name: "MakeMyTrip",
    description: "Flights, hotels, and holiday bookings.",
    href: "https://www.makemytrip.com/",
    icon: Plane,
    iconClass: "text-[#E8621A] bg-[#E8621A]/10",
  },
  {
    name: "RedBus",
    description: "Bus tickets across India.",
    href: "https://www.redbus.in/",
    icon: Bus,
    iconClass: "text-[#B71C1C] bg-[#B71C1C]/10",
  },
  {
    name: "Amazon",
    description: "Online shopping and deliveries.",
    href: "https://www.amazon.in/",
    icon: ShoppingBag,
    iconClass: "text-[#1A1A1A] bg-[#F5A623]/12",
  },
  {
    name: "Flipkart",
    description: "Online shopping for electronics, fashion, and more.",
    href: "https://www.flipkart.com/",
    icon: ShoppingBag,
    iconClass: "text-[#2874F0] bg-[#2874F0]/10",
  },
  {
    name: "Meesho",
    description: "Affordable online shopping across popular categories.",
    href: "https://www.meesho.com/",
    icon: ShoppingBag,
    iconClass: "text-[#F43397] bg-[#F43397]/10",
  },
  {
    name: "Muntra",
    description: "Fashion and lifestyle shopping platform.",
    href: "https://www.myntra.com/",
    icon: ShoppingBag,
    iconClass: "text-[#FF3F6C] bg-[#FF3F6C]/10",
  },
  {
    name: "Ajio",
    description: "Fashion and accessories shopping destination.",
    href: "https://www.ajio.com/",
    icon: ShoppingBag,
    iconClass: "text-[#3A3A3A] bg-[#3A3A3A]/10",
  },
];

export default function PersonalBooking() {
  return (
    <>
      <SEO
        title="Personal Booking — IRCTC, Travel & Shopping Links"
        description="Quick links to IRCTC, MakeMyTrip, RedBus, Amazon, Flipkart, Meesho, Muntra, and Ajio for personal convenience. Read our disclaimer before using third-party services."
        keywords="IRCTC, MakeMyTrip, RedBus, Amazon India, Flipkart, Meesho, Muntra, Ajio, personal booking, AKM Care"
        canonical="/personal-booking"
      />
      <section className="section-padding pt-6 sm:pt-8 lg:pt-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-warm-beige to-background pointer-events-none" />
        <div className="container-premium text-center max-w-3xl relative z-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary mb-2.5">Quick access</p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mb-6 bg-gradient-to-br from-foreground to-foreground/75 bg-clip-text">
            Personal booking
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            External platforms for rail, travel, and shopping—open in a new tab when you choose.
          </p>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="container-premium max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {services.map((s) => {
              const Icon = s.icon;
              return (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm transition-all hover:border-primary/25 hover:shadow-md hover:bg-card"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/40 shadow-sm ${s.iconClass}`}
                  aria-hidden
                >
                  <Icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-xl text-foreground group-hover:text-primary transition-colors">
                      {s.name}
                    </h2>
                    <ExternalLink
                      className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </a>
            );
            })}
          </div>

          <div
            className="mt-10 sm:mt-12 rounded-2xl border border-[#E8621A]/12 bg-[#F5F0EB]/80 px-4 py-4 sm:px-6 sm:py-5 text-left"
            role="region"
            aria-label="Disclaimer"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E8621A] mb-2">Disclaimer</h3>
            <p className="text-sm sm:text-[0.9375rem] text-[#1A1A1A]/75 leading-relaxed">
              This section is provided for personal convenience, bringing multiple booking and utility platforms
              into one place.
            </p>
            <p className="mt-3 text-sm sm:text-[0.9375rem] text-[#1A1A1A]/75 leading-relaxed">
              All services accessed through these links are used at your own risk. We do not charge any
              additional fees and are not responsible for transactions, issues, or outcomes on third-party
              platforms.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
