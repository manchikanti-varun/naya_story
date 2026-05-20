"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WishlistPop({ open, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const count = user?.wishlist?.length ?? 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute right-0 top-[calc(100%+0.75rem)] z-[60] w-[min(92vw,260px)] rounded-2xl border border-ivory-deep bg-ivory p-5 shadow-[0_16px_48px_-12px_rgba(44,40,37,0.18)] ring-1 ring-ink/5",
          )}
        >
          <p className="font-display text-lg text-ink">Saved pieces</p>
          <p className="mt-2 font-sans text-[12px] font-light leading-relaxed text-ink-muted">
            {user
              ? count > 0
                ? `${count} silhouette${count === 1 ? "" : "s"} in your edit.`
                : "Your wishlist is a quiet moodboard — add pieces you love."
              : "Sign in to curate a personal wishlist."}
          </p>
          <Link
            href="/account/wishlist"
            onClick={onClose}
            className="mt-5 inline-flex font-sans text-[11px] uppercase tracking-[0.28em] text-gold transition-opacity hover:opacity-80"
          >
            View wishlist
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
