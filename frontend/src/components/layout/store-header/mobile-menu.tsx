"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { SITE_NAME } from "@/lib/constants";
import { buildStorePrimaryNav } from "@/lib/store-nav";
import type { StorePageFlags } from "@/lib/store-page-flags";

const MOBILE_EXTRA = [
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Profile", href: "/account" },
  { label: "Cart", href: "#", action: "cart" as const },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenCart: () => void;
  storePageFlags?: StorePageFlags;
};

export function MobileMenu({ open, onClose, onOpenCart, storePageFlags }: Props) {
  const navItems = buildStorePrimaryNav(storePageFlags);
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[55] bg-ink/20 backdrop-blur-[3px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal
            aria-label="Navigation"
            className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-md flex-col border-l border-ivory-deep/40 bg-ivory shadow-[0_0_80px_-20px_rgba(44,40,37,0.15)] md:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-ivory-deep/35 px-6 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <span className="font-display text-lg font-normal tracking-[0.12em] text-ink">
                {SITE_NAME}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2.5 text-black transition-colors duration-500 hover:text-gold"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" strokeWidth={1.05} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-8 pb-16 pt-10">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.05 + i * 0.04,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block border-b border-transparent py-4 font-display text-2xl font-light tracking-[0.02em] text-black transition-colors duration-500 hover:border-ivory-deep/30 hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              {MOBILE_EXTRA.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.05 + (navItems.length + i) * 0.04,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {item.action === "cart" ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCart();
                      }}
                      className="block w-full border-b border-transparent py-4 text-left font-display text-2xl font-light tracking-[0.02em] text-black transition-colors duration-500 hover:text-gold"
                    >
                      Cart
                    </button>
                  ) : (
                    <Link
                      href={
                        item.label === "Profile"
                          ? user
                            ? "/account"
                            : "/login"
                          : item.href
                      }
                      onClick={onClose}
                      className="block border-b border-transparent py-4 font-display text-2xl font-light tracking-[0.02em] text-black transition-colors duration-500 hover:text-gold"
                    >
                      {item.label}
                    </Link>
                  )}
                </motion.div>
              ))}
            </nav>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
