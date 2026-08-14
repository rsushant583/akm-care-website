import { ShieldCheck, RotateCcw, Truck, BadgeCheck } from "lucide-react";

const items = [
  { icon: Truck, label: "Pan-India delivery" },
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: RotateCcw, label: "7-day returns" },
  { icon: BadgeCheck, label: "Authentic products" },
];

/** Trust copy limited to policies already used on the storefront. */
export default function TrustStrip() {
  return (
    <section className="bg-white border-y border-black/[0.04]" aria-label="Shopping assurances">
      <div className="container-premium py-3.5 sm:py-4">
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-2.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 min-w-0">
              <item.icon size={16} className="shrink-0 text-[#E8621A]" aria-hidden />
              <p className="text-xs sm:text-sm font-medium text-[#1A1A1A] leading-snug">{item.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
