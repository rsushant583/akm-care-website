import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, MapPin } from "lucide-react";
import { DigitOrbit } from "@/components/shop/PincodeServiceability";
import {
  checkPincodeServiceability,
  isValidIndianPincode,
  PINCODE_VERIFY_MIN_MS,
  type PincodeLocation,
} from "@/lib/pincodeDelivery";
import { cn } from "@/lib/utils";

type Phase = "idle" | "verifying" | "serviceable" | "unavailable" | "error";

type Props = {
  pincode: string;
  className?: string;
};

/**
 * Compact checkout pincode verification — reuses DigitOrbit,
 * keeps layout tight so the address form does not jump.
 */
export function CheckoutPincodeVerify({ pincode, className }: Props) {
  const reduce = useReducedMotion() === true;
  const [phase, setPhase] = useState<Phase>("idle");
  const [location, setLocation] = useState<PincodeLocation | null>(null);
  const pin = pincode.trim();

  useEffect(() => {
    if (!isValidIndianPincode(pin)) {
      setPhase("idle");
      setLocation(null);
      return;
    }

    const ac = new AbortController();
    setPhase("verifying");
    setLocation(null);
    const started = performance.now();

    void (async () => {
      try {
        const resultPromise = checkPincodeServiceability(pin, ac.signal);
        const waitMs = Math.max(0, PINCODE_VERIFY_MIN_MS);
        await new Promise<void>((resolve, reject) => {
          const id = window.setTimeout(resolve, waitMs);
          ac.signal.addEventListener(
            "abort",
            () => {
              window.clearTimeout(id);
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        });
        const result = await resultPromise;
        if (ac.signal.aborted) return;
        setLocation(result.location);
        setPhase(result.available ? "serviceable" : "unavailable");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (ac.signal.aborted) return;
        const elapsed = performance.now() - started;
        if (elapsed < PINCODE_VERIFY_MIN_MS) {
          await new Promise((r) => window.setTimeout(r, PINCODE_VERIFY_MIN_MS - elapsed));
        }
        if (ac.signal.aborted) return;
        setPhase("error");
      }
    })();

    return () => ac.abort();
  }, [pin]);

  if (phase === "idle") return null;

  return (
    <div className={cn("rounded-xl border border-black/[0.06] bg-[#FAF8F5]/80 overflow-hidden", className)}>
      <div aria-live="polite" className="sr-only">
        {phase === "verifying" && "Checking delivery availability."}
        {phase === "serviceable" &&
          (location?.area
            ? `You're covered. We'd love to deliver to ${location.area}.`
            : "You're covered. Delivery available to this area.")}
        {phase === "unavailable" && "We don't deliver here yet. Have another address nearby?"}
        {phase === "error" && "We couldn't verify this pincode right now."}
      </div>

      <AnimatePresence mode="wait">
        {phase === "verifying" ? (
          <motion.div
            key="verify"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.25 }}
            className="py-1"
          >
            <DigitOrbit digits={pin.split("")} reduced={reduce} />
            <p className="text-center text-[11px] text-[#6B6B6B] pb-2">Verifying {pin}…</p>
          </motion.div>
        ) : (
          <motion.div
            key={phase}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="px-3 py-3 flex items-start gap-2.5"
          >
            {phase === "serviceable" ? (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8621A] text-white shadow-[0_0_12px_rgba(232,98,26,0.28)]">
                <Check size={14} strokeWidth={2.5} aria-hidden />
              </span>
            ) : (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[#6B6B6B]">
                <MapPin size={14} aria-hidden />
              </span>
            )}
            <div className="min-w-0 text-sm">
              {phase === "serviceable" && (
                <>
                  <p className="font-heading text-[#1A1A1A]">You're covered</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    {location?.area
                      ? `We'd love to deliver to ${location.area}${
                          location.city ? `, ${location.city}` : ""
                        }.`
                      : "Delivery available to this area."}
                  </p>
                </>
              )}
              {phase === "unavailable" && (
                <>
                  <p className="font-medium text-[#1A1A1A]">We don't deliver here yet.</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">Have another address nearby?</p>
                </>
              )}
              {phase === "error" && (
                <p className="text-xs text-[#6B6B6B]">We couldn't verify this pincode right now.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
