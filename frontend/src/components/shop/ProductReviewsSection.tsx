"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Props = {
  productName: string;
  className?: string;
};

export function ProductReviewsSection({ productName, className }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const displayRating = hoverRating || rating;

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!body.trim() || rating < 1) return;
      setSubmitted(true);
      window.setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setBody("");
        setRating(0);
      }, 1600);
    },
    [body, rating],
  );

  const modal =
    mounted && open ? (
      <AnimatePresence>
        <motion.div
          key="review-overlay"
          className="fixed inset-0 z-[92] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-lux border border-ivory-deep bg-ivory p-6 shadow-lux"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-2 text-ink-soft hover:text-ink"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <h3 id="review-dialog-title" className="pr-10 font-display text-xl text-ink">
              Review · {productName}
            </h3>
            <p className="mt-2 font-sans text-xs text-ink-muted">
              Reviews are moderated before appearing on the site.
            </p>

            {submitted ? (
              <p className="mt-8 font-sans text-sm text-ink-muted">
                Thank you — we&apos;ve received your note.
              </p>
            ) : (
              <form className="mt-6 space-y-5 text-left" onSubmit={onSubmit}>
                <div>
                  <p className="pdp-option-label mb-2">Rating</p>
                  <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {Array.from({ length: 5 }, (_, i) => {
                      const v = i + 1;
                      const active = displayRating >= v;
                      return (
                        <button
                          key={v}
                          type="button"
                          className="rounded p-1 text-gold transition hover:opacity-90"
                          aria-label={`${v} stars`}
                          onMouseEnter={() => setHoverRating(v)}
                          onClick={() => setRating(v)}
                        >
                          <Star
                            className="h-6 w-6"
                            strokeWidth={1.25}
                            fill={active ? "currentColor" : "transparent"}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="block">
                  <span className="pdp-option-label">Your review</span>
                  <textarea
                    required
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="mt-2 w-full rounded-md border border-ivory-deep bg-white px-3 py-2 font-sans text-sm font-light text-ink placeholder:text-ink-soft/60"
                    placeholder="Fit, fabric, occasion…"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-md border border-ink bg-ink py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-ivory transition hover:bg-ink/90"
                >
                  Submit review
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    ) : null;

  return (
    <section className={cn("text-center", className)}>
      <p className="lux-kicker">Reviews</p>
      <h2 className="lux-heading-rail mt-2">Client reflections</h2>
      <p className="mx-auto mt-3 max-w-md font-sans text-sm font-light text-ink-muted">
        Share how this piece feels in motion — fit, fabric, and occasion. Your note helps others
        choose with confidence.
      </p>
      <div className="mt-4 flex justify-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className="h-4 w-4 text-ivory-deep"
            strokeWidth={1}
            fill="transparent"
          />
        ))}
      </div>
      <p className="mt-2 font-sans text-xs text-ink-soft">No published reviews yet</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex rounded-md border border-ivory-deep bg-transparent px-8 py-2.5 font-sans text-[11px] uppercase tracking-[0.2em] text-ink transition hover:border-gold/50 hover:text-gold"
      >
        Write a review
      </button>

      {mounted && open ? createPortal(modal, document.body) : null}
    </section>
  );
}
