import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import yogaDayPoster from "@/assets/yoga-day-2026.jpeg";
import { isYogaDay, YOGA_DAY_MODAL_SESSION_KEY } from "@/lib/yogaDay";

export default function YogaDayCelebration() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showRibbon, setShowRibbon] = useState(false);

  useEffect(() => {
    if (!isYogaDay()) return;

    setActive(true);
    const dismissed = sessionStorage.getItem(YOGA_DAY_MODAL_SESSION_KEY) === "1";
    if (dismissed) {
      setShowRibbon(true);
    } else {
      setModalOpen(true);
    }
  }, []);

  const closeModal = useCallback(() => {
    sessionStorage.setItem(YOGA_DAY_MODAL_SESSION_KEY, "1");
    setModalOpen(false);
    setShowRibbon(true);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, closeModal]);

  if (!active) return null;

  return (
    <>
      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            key="yoga-day-modal"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-label="International Yoga Day 2026"
          >
            <motion.div
              className="relative w-full max-w-md sm:max-w-lg rounded-2xl overflow-hidden bg-white shadow-[0_28px_80px_rgba(26,26,26,0.28)] border border-white/60"
              initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors"
                aria-label="Close International Yoga Day message"
              >
                <X size={18} />
              </button>
              <img
                src={yogaDayPoster}
                alt="International Yoga Day 2026 — AKM Care wishes you a healthy and mindful Yoga Day"
                width={960}
                height={960}
                loading="eager"
                decoding="async"
                className="block w-full h-auto"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showRibbon && !modalOpen ? (
          <motion.div
            key="yoga-day-ribbon"
            className="fixed top-[calc(3.2rem+2.25rem+env(safe-area-inset-top,0px)+0.35rem)] lg:top-[calc(3.8rem+2.25rem+env(safe-area-inset-top,0px)+0.35rem)] right-3 sm:right-4 z-[45] max-w-[min(calc(100vw-1.5rem),16rem)] rounded-full border border-[#E8621A]/25 bg-white/92 backdrop-blur-sm px-3 py-1.5 text-[0.65rem] sm:text-xs font-semibold text-[#1A1A1A] shadow-[0_8px_24px_rgba(232,98,26,0.14)]"
            initial={reduce ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <span className="text-[#E8621A]">🧘</span> Happy International Yoga Day 2026
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
