"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Product, ProductVariant } from "@/types";
import { cn } from "@/lib/cn";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = {
  visible: boolean;
  product: Product;
  variant: ProductVariant | null;
  size: string;
  sizes: string[];
  qty: number;
  canAdd: boolean;
  addedPulse: boolean;
  onSizeChange: (size: string) => void;
  onQtyChange: (qty: number) => void;
  onAdd: () => void;
};

function stockForSize(product: Product, sizeName: string) {
  return product.variants
    .filter((v) => v.size === sizeName)
    .reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

export function ProductStickyCartBar({
  visible,
  product,
  variant,
  size,
  sizes,
  qty,
  canAdd,
  addedPulse,
  onSizeChange,
  onQtyChange,
  onAdd,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const thumb = product.images[0];

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    document.documentElement.classList.add("pdp-sticky-cart-active");
    return () => document.documentElement.classList.remove("pdp-sticky-cart-active");
  }, [visible]);

  if (!mounted) return null;

  const bar = (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="region"
          aria-label="Quick add to bag"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-[55] border-t border-ivory-deep/90 bg-ivory/98 shadow-[0_-12px_40px_-12px_rgba(44,40,37,0.12)] backdrop-blur-md safe-bottom"
        >
          <div className="mx-auto flex max-w-[1480px] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 md:gap-4">
            <Link
              href={`/products/${product.slug}`}
              className="hidden min-w-0 items-center gap-2.5 sm:flex sm:max-w-[min(28vw,220px)]"
            >
              {thumb ? (
                <span
                  className={cn(
                    "relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-ivory-soft",
                    storefrontImageShellClass,
                  )}
                >
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    {...storefrontImageProps}
                  />
                </span>
              ) : null}
              <span className="truncate font-sans text-xs font-medium text-ink">{product.name}</span>
            </Link>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-2.5">
              {sizes.length > 0 ? (
                <label className="sr-only" htmlFor="sticky-size">
                  Size
                </label>
              ) : null}
              {sizes.length > 0 ? (
                <select
                  id="sticky-size"
                  value={size}
                  onChange={(e) => onSizeChange(e.target.value)}
                  className="max-w-[7.5rem] shrink-0 rounded-lg border border-ivory-deep bg-white px-2 py-2.5 font-sans text-[11px] text-ink sm:max-w-none sm:px-3 sm:text-xs"
                >
                  {sizes.map((s) => {
                    const stock = stockForSize(product, s);
                    const label =
                      stock <= 0
                        ? `${s} — out of stock`
                        : `${s} · ₹${product.price.toLocaleString("en-IN")}`;
                    return (
                      <option key={s} value={s} disabled={stock <= 0}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : null}

              <div className="inline-flex shrink-0 items-center rounded-lg border border-ivory-deep bg-white">
                <button
                  type="button"
                  className="flex h-10 w-9 items-center justify-center text-ink-muted hover:text-ink"
                  aria-label="Decrease quantity"
                  onClick={() => onQtyChange(Math.max(1, qty - 1))}
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <span className="min-w-[1.75rem] text-center font-sans text-sm tabular-nums">{qty}</span>
                <button
                  type="button"
                  className="flex h-10 w-9 items-center justify-center text-ink-muted hover:text-ink"
                  aria-label="Increase quantity"
                  onClick={() => onQtyChange(qty + 1)}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>

              <button
                type="button"
                disabled={!canAdd}
                onClick={onAdd}
                className={cn(
                  "shrink-0 rounded-lg bg-ink px-4 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:text-[11px]",
                  addedPulse && "bg-gold",
                )}
              >
                {addedPulse ? "Added" : "Add to bag"}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(bar, document.body);
}
