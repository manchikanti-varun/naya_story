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

export function ProfileMenu({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
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
          ref={panelRef}
          id="profile-menu-panel"
          role="menu"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute right-0 top-[calc(100%+0.75rem)] z-[60] w-[min(92vw,220px)] rounded-2xl border border-ivory-deep/60 bg-ivory/98 py-2 shadow-[0_12px_40px_-8px_rgba(44,40,37,0.12)] backdrop-blur-md",
          )}
        >
          {user ? (
            <>
              <Link
                role="menuitem"
                href="/account"
                className="block px-5 py-3 font-sans text-[13px] font-light tracking-wide text-ink transition-colors hover:bg-ivory-soft hover:text-gold"
                onClick={onClose}
              >
                My account
              </Link>
              <Link
                role="menuitem"
                href="/account/orders"
                className="block px-5 py-3 font-sans text-[13px] font-light tracking-wide text-ink transition-colors hover:bg-ivory-soft hover:text-gold"
                onClick={onClose}
              >
                Orders
              </Link>
              <Link
                role="menuitem"
                href="/account/wishlist"
                className="block px-5 py-3 font-sans text-[13px] font-light tracking-wide text-ink transition-colors hover:bg-ivory-soft hover:text-gold"
                onClick={onClose}
              >
                Wishlist
              </Link>
              <div className="my-1 h-px bg-ivory-deep/50" />
              <button
                type="button"
                role="menuitem"
                className="w-full px-5 py-3 text-left font-sans text-[13px] font-light tracking-wide text-ink-muted transition-colors hover:bg-ivory-soft hover:text-ink"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                role="menuitem"
                href="/login"
                className="block px-5 py-3 font-sans text-[13px] font-light tracking-wide text-ink transition-colors hover:bg-ivory-soft hover:text-gold"
                onClick={onClose}
              >
                Sign in
              </Link>
              <Link
                role="menuitem"
                href="/register"
                className="block px-5 py-3 font-sans text-[13px] font-light tracking-wide text-ink-muted transition-colors hover:bg-ivory-soft hover:text-ink"
                onClick={onClose}
              >
                Create account
              </Link>
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
