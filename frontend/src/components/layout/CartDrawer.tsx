"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { lineKey, useCart } from "@/context/cart-context";
import { cn } from "@/lib/cn";
import { FREE_SHIPPING_THRESHOLD_INR } from "@/lib/store-shipping";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    lines,
    updateQty,
    removeLine,
    subtotal,
    coupon,
    setCoupon,
  } = useCart();
  const [couponInput, setCouponInput] = useState("");

  const shipping = useMemo(
    () => (subtotal >= FREE_SHIPPING_THRESHOLD_INR ? 0 : 299),
    [subtotal],
  );
  const discount = useMemo(() => {
    if (!coupon) return 0;
    const c = coupon.toUpperCase();
    if (c === "NAYA10") return Math.round(subtotal * 0.1);
    if (c === "WELCOME500") return Math.min(500, subtotal);
    return 0;
  }, [coupon, subtotal]);

  const total = Math.max(0, subtotal + shipping - discount);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close overlay"
            className="fixed inset-0 z-[60] bg-ink/20 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal
            className={cn(
              "fixed bottom-0 right-0 top-0 z-[70] flex w-full max-w-md flex-col border-l border-ivory-deep/40 bg-ivory shadow-[0_24px_64px_-16px_rgba(44,40,37,0.14)]",
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
          >
            <div className="flex items-center justify-between border-b border-ivory-deep px-6 py-5">
              <div>
                <p className="lux-kicker">Shopping</p>
                <h2 className="lux-title-section mt-1">Your bag</h2>
                <p className="mt-1 font-sans text-xs uppercase tracking-[0.22em] text-ink-soft">
                  {lines.length} item{lines.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="rounded-full p-2 text-ink-muted hover:text-ink"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-6 py-16 text-center">
                  <p className="lux-copy text-ink-muted">Your bag is resting.</p>
                  <Link
                    href="/collections"
                    onClick={closeCart}
                    className="lux-btn-outline"
                  >
                    Explore collections
                  </Link>
                </div>
              ) : (
                <ul className="space-y-8">
                  {lines.map((line) => {
                    const key = lineKey(line);
                    return (
                      <li key={key} className="flex gap-4">
                        <div
                          className={cn(
                            "relative h-28 w-24 shrink-0 overflow-hidden rounded-lux bg-ivory-soft",
                            storefrontImageShellClass,
                          )}
                        >
                          <Image
                            src={line.image}
                            alt={line.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                            {...storefrontImageProps}
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-3">
                          <div className="flex justify-between gap-4">
                            <div>
                              <Link
                                href={`/products/${line.slug}`}
                                onClick={closeCart}
                                className="lux-product-name text-lg leading-snug"
                              >
                                {line.name}
                              </Link>
                              <p className="mt-1 font-sans text-xs uppercase tracking-[0.18em] text-ink-soft">
                                {line.color} · Size {line.size}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="self-start text-ink-soft hover:text-ink"
                              aria-label="Remove item"
                              onClick={() => removeLine(key)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-3 rounded-full border border-ivory-deep px-2 py-1">
                              <button
                                type="button"
                                className="rounded-full p-1 hover:bg-ivory-soft"
                                aria-label="Decrease quantity"
                                onClick={() =>
                                  updateQty(key, Math.max(1, line.quantity - 1))
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="min-w-[1.5rem] text-center font-sans text-sm">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                className="rounded-full p-1 hover:bg-ivory-soft"
                                aria-label="Increase quantity"
                                onClick={() => updateQty(key, line.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="font-sans text-sm tracking-wide text-ink">
                              ₹{(line.price * line.quantity).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {lines.length > 0 ? (
              <div className="border-t border-ivory-deep px-6 py-6">
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Promo code"
                    className="flex-1 rounded-full border border-ivory-deep bg-white px-4 py-3 font-sans text-sm text-ink outline-none ring-gold/40 placeholder:text-ink-soft focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(couponInput.trim() || undefined);
                    }}
                    className="lux-btn-ink shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {coupon ? (
                  <p className="mt-2 font-sans text-xs text-ink-muted">
                    Applied: <span className="text-gold">{coupon}</span>
                    {discount === 0 ? " — invalid or expired for this cart." : ""}
                  </p>
                ) : null}

                <dl className="mt-6 space-y-3 font-sans text-sm text-ink-muted">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd className="text-ink">₹{subtotal.toLocaleString("en-IN")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Shipping</dt>
                    <dd className="text-ink">
                      {shipping === 0 ? "Complimentary" : `₹${shipping}`}
                    </dd>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between text-gold">
                      <dt>Discount</dt>
                      <dd>-₹{discount.toLocaleString("en-IN")}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-ivory-deep pt-3 font-display text-lg text-ink">
                    <dt>Total</dt>
                    <dd>₹{total.toLocaleString("en-IN")}</dd>
                  </div>
                </dl>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="lux-btn-primary mt-6"
                >
                  Checkout
                </Link>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
