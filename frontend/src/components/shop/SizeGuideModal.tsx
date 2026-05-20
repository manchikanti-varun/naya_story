"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

const rows = [
  { size: "XS", bust: "80", waist: "62", hip: "88" },
  { size: "S", bust: "84", waist: "66", hip: "92" },
  { size: "M", bust: "88", waist: "70", hip: "96" },
  { size: "L", bust: "92", waist: "74", hip: "100" },
  { size: "XL", bust: "96", waist: "78", hip: "104" },
];

export function SizeGuideModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[3px]" aria-hidden />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="size-guide-title"
            className="relative z-10 flex max-h-[min(88vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-lux-lg border border-ivory-deep/60 bg-ivory shadow-lux safe-bottom sm:max-h-[min(85vh,640px)] sm:rounded-lux-lg"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="overflow-y-auto overscroll-contain p-5 sm:p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.25 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="lux-kicker text-gold/90">Fit guide</p>
                  <h2 id="size-guide-title" className="mt-2 font-display text-3xl text-ink">
                    Size chart
                  </h2>
                  <p className="mt-2 font-sans text-sm font-light text-ink-muted">
                    Measurements in centimetres. Between sizes? We recommend sizing up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full p-2 text-ink-muted transition-colors hover:bg-ivory-deep/40 hover:text-ink"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={1.25} />
                </button>
              </div>
              <div className="mt-6 -mx-1 overflow-x-auto sm:mt-8">
                <table className="min-w-[320px] w-full text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-ivory-deep text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                      <th className="pb-3 pr-4">Size</th>
                      <th className="pb-3 pr-4">Bust</th>
                      <th className="pb-3 pr-4">Waist</th>
                      <th className="pb-3">Hip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.size} className="border-b border-ivory-deep/60">
                        <td className="py-3.5 font-medium text-ink">{row.size}</td>
                        <td className="py-3.5 text-ink-muted">{row.bust}</td>
                        <td className="py-3.5 text-ink-muted">{row.waist}</td>
                        <td className="py-3.5 text-ink-muted">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
