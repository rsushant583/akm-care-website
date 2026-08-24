import { useMemo, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, MapPin } from "lucide-react";
import { usePincodeCheck } from "@/hooks/usePincodeCheck";
import { cn } from "@/lib/utils";
import type { PincodeCheckStatus, PincodeLocation } from "@/lib/pincodeDelivery";

type Variant = "card" | "compact";

type Props = {
  variant?: Variant;
  className?: string;
  /** Optional shipping note under success (e.g. PDP shipping label). */
  footer?: ReactNode;
};

const ORBIT_RADIUS = 28;
const DIGIT_COUNT = 6;

function orbitOffset(index: number, radius = ORBIT_RADIUS) {
  const angle = (Math.PI * 2 * index) / DIGIT_COUNT - Math.PI / 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

/** Exported for compact checkout embedding — same orbital language as shop/PDP. */
export function DigitOrbit({
  digits,
  reduced,
}: {
  digits: string[];
  reduced: boolean;
}) {
  if (reduced) {
    return (
      <div className="relative mx-auto flex h-[120px] w-full max-w-[220px] items-center justify-center">
        <motion.div
          className="absolute h-16 w-16 rounded-full bg-[#E8621A]/15"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: [0.55, 1, 0.55], scale: [0.92, 1, 0.92] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-[1] flex gap-1.5 font-mono text-lg font-semibold tracking-[0.2em] text-[#1A1A1A]">
          {digits.map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[132px] w-full max-w-[240px]" aria-hidden>
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,98,26,0.28) 0%, rgba(232,98,26,0.08) 45%, transparent 70%)",
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0.75, 1], scale: [0.6, 1.05, 1, 1.04] }}
        transition={{
          duration: 1.6,
          times: [0, 0.35, 0.7, 1],
          repeat: Infinity,
          repeatDelay: 0.15,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      <div className="absolute left-1/2 top-1/2 h-0 w-0">
        {digits.map((digit, i) => {
          const orbit = orbitOffset(i);
          const spread = orbitOffset(i, 18);
          return (
            <motion.span
              key={`${digit}-${i}`}
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-[#E8621A]/15 bg-white/90 text-sm font-semibold text-[#1A1A1A] shadow-[0_1px_6px_rgba(26,26,26,0.06)]"
              initial={{ x: (i - 2.5) * 22, y: 0, opacity: 1, scale: 1, rotate: 0 }}
              animate={{
                x: [(i - 2.5) * 22, spread.x * 1.15, orbit.x, 0],
                y: [0, spread.y * 0.35, orbit.y, 0],
                rotate: [0, i % 2 === 0 ? -8 : 8, (i - 2.5) * 6, 0],
                scale: [1, 1.04, 0.96, 0.5],
                opacity: [1, 1, 0.95, 0],
              }}
              transition={{
                duration: 0.95,
                times: [0, 0.22, 0.62, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {digit}
            </motion.span>
          );
        })}
      </div>

      <motion.div
        className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8621A] text-white shadow-[0_0_24px_rgba(232,98,26,0.35)]"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.68, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="h-2 w-2 rounded-full bg-white/90"
          animate={{ opacity: [0.45, 1, 0.45], scale: [0.85, 1.12, 0.85] }}
          transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}

function SuccessPanel({
  location,
  pincode,
  reduced,
}: {
  location: PincodeLocation | null;
  pincode: string;
  reduced: boolean;
}) {
  const areaLine = location?.area?.trim();
  const region = [location?.city, location?.state].filter(Boolean).join(", ");

  return (
    <motion.div
      className="mx-auto max-w-sm text-center"
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(232,98,26,0.22) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#E8621A] text-white shadow-[0_0_20px_rgba(232,98,26,0.28)]">
          <Check size={22} strokeWidth={2.5} aria-hidden />
        </span>
      </div>

      <p className="font-heading text-lg text-[#1A1A1A]">You're covered</p>
      {areaLine ? (
        <>
          <p className="mt-1.5 text-sm text-[#6B6B6B]">We'd love to deliver to</p>
          <p className="mt-0.5 text-base font-semibold text-[#1A1A1A]">{areaLine}</p>
          {region ? <p className="mt-0.5 text-sm text-[#6B6B6B]">{region}</p> : null}
        </>
      ) : (
        <p className="mt-1.5 text-sm text-[#6B6B6B]">
          We'd love to deliver to pincode {pincode}.
        </p>
      )}
      <motion.p
        className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-[#E8621A]"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.18, duration: 0.35 }}
      >
        Delivery available
      </motion.p>
    </motion.div>
  );
}

function UnavailablePanel({
  onRetry,
  reduced,
}: {
  onRetry: () => void;
  reduced: boolean;
}) {
  return (
    <motion.div
      className="mx-auto max-w-sm text-center"
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.35 }}
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#6B6B6B]">
        <MapPin size={18} aria-hidden />
      </div>
      <p className="font-heading text-lg text-[#1A1A1A]">We don't deliver here yet.</p>
      <p className="mt-1.5 text-sm text-[#6B6B6B]">Have another address nearby?</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#E8621A] px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40"
      >
        Try another pincode
      </button>
      <p className="mt-3 text-xs text-[#6B6B6B]">
        Enter a family member's or friend's pincode.
      </p>
    </motion.div>
  );
}

function ResultStage({
  status,
  location,
  pincode,
  onClear,
  onRetry,
  reduced,
}: {
  status: PincodeCheckStatus;
  location: PincodeLocation | null;
  pincode: string;
  onClear: () => void;
  onRetry: () => void;
  reduced: boolean;
}) {
  if (status === "serviceable") {
    return (
      <div className="space-y-3">
        <SuccessPanel location={location} pincode={pincode} reduced={reduced} />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-medium text-[#6B6B6B] underline-offset-2 hover:text-[#1A1A1A] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
          >
            Check a different pincode
          </button>
        </div>
      </div>
    );
  }

  if (status === "unavailable") {
    return <UnavailablePanel onRetry={onClear} reduced={reduced} />;
  }

  if (status === "error") {
    return (
      <motion.div
        className="mx-auto max-w-sm text-center"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-[#1A1A1A]">
          We couldn't verify this pincode right now.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-[#1A1A1A] hover:border-[#E8621A]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35"
        >
          Try again
        </button>
      </motion.div>
    );
  }

  return null;
}

export function PincodeServiceability({
  variant = "card",
  className,
  footer,
}: Props) {
  const reduceMotion = useReducedMotion() === true;
  const {
    value,
    status,
    location,
    checkedPincode,
    setValue,
    clear,
    retry,
    liveMessage,
  } = usePincodeCheck();

  const digits = useMemo(
    () => (checkedPincode ?? value).padEnd(6, " ").slice(0, 6).split(""),
    [checkedPincode, value],
  );

  const showResult =
    status === "serviceable" || status === "unavailable" || status === "error";
  const inputSoftened = status === "verifying";

  const shell =
    variant === "card"
      ? "max-w-xl bg-white rounded-2xl border border-black/[0.08] p-5 sm:p-6 shadow-sm"
      : "rounded-xl border border-black/[0.06] bg-[#FAF8F5] p-3.5";

  return (
    <div id={`pincode-serviceability-${variant}`} className={cn(shell, className)}>
      {variant === "card" ? (
        <>
          <h2 className="font-heading text-lg sm:text-xl mb-1 text-[#1A1A1A]">
            Check Delivery Availability by Pincode
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your 6-digit Indian pincode
          </p>
        </>
      ) : (
        <p className="text-sm font-semibold text-[#1A1A1A] mb-2">Deliver to</p>
      )}

      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      <AnimatePresence mode="wait">
        {showResult ? (
          <motion.div
            key={`result-${status}-${checkedPincode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ResultStage
              status={status}
              location={location}
              pincode={checkedPincode ?? value}
              onClear={clear}
              onRetry={retry}
              reduced={reduceMotion}
            />
          </motion.div>
        ) : (
          <motion.div
            key="input-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {status === "verifying" && (
              <DigitOrbit
                digits={(checkedPincode ?? value).split("")}
                reduced={reduceMotion}
              />
            )}

            <div
              className={cn(
                "flex gap-2 transition-opacity duration-300",
                variant === "card" && "flex-col sm:flex-row sm:gap-3",
                inputSoftened && "opacity-40 pointer-events-none",
                status === "verifying" && "sr-only",
              )}
            >
              <label className="sr-only" htmlFor={`pincode-${variant}`}>
                Pincode
              </label>
              <input
                id={`pincode-${variant}`}
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                placeholder={variant === "card" ? "Pincode" : "Enter pincode"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={status === "verifying"}
                className={cn(
                  "flex-1 min-w-0 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/35",
                  variant === "card"
                    ? "px-4 py-3 rounded-xl border border-border bg-background text-base"
                    : "h-11 rounded-full border border-black/10 bg-white px-4",
                )}
                aria-invalid={status === "invalid"}
                aria-describedby={status === "invalid" ? `pincode-${variant}-error` : undefined}
              />
              {/* Manual check retained for accessibility / incomplete edits */}
              <button
                type="button"
                onClick={retry}
                disabled={status === "verifying" || value.length === 0}
                className={cn(
                  "shrink-0 font-semibold transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8621A]/40",
                  variant === "card"
                    ? "px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 whitespace-nowrap"
                    : "btn-secondary h-11 px-4",
                )}
              >
                {variant === "card" ? "Check Availability" : "Check"}
              </button>
            </div>

            {status === "invalid" && (
              <p
                id={`pincode-${variant}-error`}
                className={cn(
                  "text-destructive",
                  variant === "card" ? "text-sm mt-3" : "text-xs mt-2",
                )}
              >
                Enter a valid 6-digit pincode.
              </p>
            )}

            {status === "verifying" && (
              <p className="mt-1 text-center text-xs text-[#6B6B6B]">
                Verifying {digits.filter((d) => d.trim()).join("")}…
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {footer && status !== "verifying" ? (
        <div className="mt-2 pt-0.5">{footer}</div>
      ) : null}
    </div>
  );
}
