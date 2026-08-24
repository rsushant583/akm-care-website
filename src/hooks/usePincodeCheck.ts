import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkPincodeServiceability,
  isValidIndianPincode,
  PINCODE_VERIFY_MIN_MS,
  type PincodeCheckStatus,
  type PincodeLocation,
  type PincodeServiceabilityResult,
} from "@/lib/pincodeDelivery";

export type UsePincodeCheckReturn = {
  value: string;
  status: PincodeCheckStatus;
  location: PincodeLocation | null;
  checkedPincode: string | null;
  setValue: (next: string) => void;
  clear: () => void;
  retry: () => void;
  liveMessage: string;
};

function sanitizePincode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = window.setTimeout(() => resolve(), ms);
    const onAbort = () => {
      window.clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function usePincodeCheck(): UsePincodeCheckReturn {
  const [value, setValueState] = useState("");
  const [status, setStatus] = useState<PincodeCheckStatus>("idle");
  const [location, setLocation] = useState<PincodeLocation | null>(null);
  const [checkedPincode, setCheckedPincode] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastAutoRef = useRef<string | null>(null);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    requestIdRef.current += 1;
  }, []);

  const runCheck = useCallback(
    async (pin: string) => {
      if (!isValidIndianPincode(pin)) {
        setStatus("invalid");
        setLocation(null);
        setCheckedPincode(null);
        return;
      }

      cancelInFlight();
      const requestId = requestIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("verifying");
      setLocation(null);
      setCheckedPincode(pin);

      const started = performance.now();

      try {
        const resultPromise = checkPincodeServiceability(pin, controller.signal);
        const minPromise = wait(PINCODE_VERIFY_MIN_MS, controller.signal);
        const [result] = await Promise.all([resultPromise, minPromise]);

        if (requestId !== requestIdRef.current || controller.signal.aborted) return;

        applyResult(result);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;
        // Still honor min duration feel on hard failure
        const elapsed = performance.now() - started;
        if (elapsed < PINCODE_VERIFY_MIN_MS) {
          try {
            await wait(PINCODE_VERIFY_MIN_MS - elapsed, controller.signal);
          } catch {
            return;
          }
        }
        if (requestId !== requestIdRef.current) return;
        setStatus("error");
        setLocation(null);
      }
    },
    [cancelInFlight],
  );

  function applyResult(result: PincodeServiceabilityResult) {
    setCheckedPincode(result.pincode);
    setLocation(result.location);
    setStatus(result.available ? "serviceable" : "unavailable");
  }

  const setValue = useCallback(
    (next: string) => {
      const sanitized = sanitizePincode(next);
      setValueState(sanitized);

      if (sanitized.length < 6) {
        cancelInFlight();
        lastAutoRef.current = null;
        setStatus(sanitized.length === 0 ? "idle" : "idle");
        setLocation(null);
        setCheckedPincode(null);
        return;
      }

      // Exactly 6 digits — auto-verify once per distinct value
      if (sanitized !== lastAutoRef.current) {
        lastAutoRef.current = sanitized;
        void runCheck(sanitized);
      }
    },
    [cancelInFlight, runCheck],
  );

  const clear = useCallback(() => {
    cancelInFlight();
    lastAutoRef.current = null;
    setValueState("");
    setStatus("idle");
    setLocation(null);
    setCheckedPincode(null);
  }, [cancelInFlight]);

  const retry = useCallback(() => {
    const pin = value.trim();
    if (!isValidIndianPincode(pin)) {
      setStatus("invalid");
      return;
    }
    lastAutoRef.current = pin;
    void runCheck(pin);
  }, [runCheck, value]);

  useEffect(() => () => cancelInFlight(), [cancelInFlight]);

  const liveMessage = (() => {
    switch (status) {
      case "invalid":
        return "Enter a valid 6-digit pincode.";
      case "verifying":
        return "Checking delivery availability.";
      case "serviceable": {
        const area = location?.area;
        return area
          ? `You're covered. We'd love to deliver to ${area}.`
          : "You're covered. Delivery available to this area.";
      }
      case "unavailable":
        return "We don't deliver here yet. Have another address nearby?";
      case "error":
        return "We couldn't verify this pincode right now. Please try again.";
      default:
        return "";
    }
  })();

  return {
    value,
    status,
    location,
    checkedPincode,
    setValue,
    clear,
    retry,
    liveMessage,
  };
}
