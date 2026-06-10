"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type ReviewItem = {
  _id: string;
  rating: number;
  body: string;
  createdAt: string;
  user?: { name?: string; email?: string };
};

type ReviewsResponse = {
  reviews: ReviewItem[];
  total: number;
  page: number;
  pages: number;
  averageRating: number;
  totalCount: number;
};

type Props = {
  productId: string;
  productName: string;
  className?: string;
};

export function ProductReviewsSection({ productId, productName, className }: Props) {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reviews data
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch reviews on mount
  useEffect(() => {
    if (!productId) return;
    setLoadingReviews(true);
    apiFetch<ReviewsResponse>(`/reviews/${productId}`)
      .then((data) => {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalCount(data.totalCount);
      })
      .catch(() => {
        // Non-critical — section still renders
      })
      .finally(() => setLoadingReviews(false));
  }, [productId]);

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
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!body.trim() || rating < 1) return;
      if (!token) {
        setError("Please log in to submit a review.");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        await apiFetch(`/reviews/${productId}`, {
          method: "POST",
          token,
          body: JSON.stringify({ rating, body: body.trim() }),
        });
        setSubmitted(true);
        window.setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
          setBody("");
          setRating(0);
        }, 1600);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to submit review";
        setError(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [body, rating, token, productId],
  );

  const renderStars = (value: number, size = "h-4 w-4") =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(size, value >= i + 1 ? "text-gold" : "text-ivory-deep")}
        strokeWidth={1}
        fill={value >= i + 1 ? "currentColor" : "transparent"}
      />
    ));

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
                {error && (
                  <p className="font-sans text-xs text-red-600">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md border border-ink bg-ink py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-ivory transition hover:bg-ink/90 disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit review"}
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

      {/* Aggregate rating */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="flex gap-0.5" aria-hidden>
          {renderStars(Math.round(averageRating))}
        </div>
        {totalCount > 0 && (
          <span className="font-sans text-xs text-ink-soft">
            {averageRating.toFixed(1)} ({totalCount} {totalCount === 1 ? "review" : "reviews"})
          </span>
        )}
      </div>

      {totalCount === 0 && !loadingReviews && (
        <p className="mt-2 font-sans text-xs text-ink-soft">No published reviews yet</p>
      )}

      {/* Reviews marquee */}
      {reviews.length > 0 && (
        <div className="group/marquee relative mt-8 overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-ivory to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-ivory to-transparent" />

          <div className="flex animate-marquee gap-5 group-hover/marquee:[animation-play-state:paused]">
            {/* Duplicate reviews for seamless loop */}
            {[...reviews, ...reviews].map((review, i) => (
              <div
                key={`${review._id}-${i}`}
                className="w-[300px] shrink-0 rounded-xl border border-ivory-deep/60 bg-white/80 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-0.5">{renderStars(review.rating, "h-3.5 w-3.5")}</div>
                  <span className="font-sans text-[10px] text-ink-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 font-sans text-sm font-light leading-relaxed text-ink">
                  {review.body}
                </p>
                <p className="mt-3 font-sans text-xs font-medium text-ink-soft">
                  {review.user?.name || "Anonymous"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!user) {
            setError("Please log in to write a review.");
            setOpen(true);
          } else {
            setError(null);
            setOpen(true);
          }
        }}
        className="mt-6 inline-flex rounded-md border border-ivory-deep bg-transparent px-8 py-2.5 font-sans text-[11px] uppercase tracking-[0.2em] text-ink transition hover:border-gold/50 hover:text-gold"
      >
        Write a review
      </button>

      {mounted && open ? createPortal(modal, document.body) : null}
    </section>
  );
}
