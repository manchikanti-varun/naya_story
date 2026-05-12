"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/cart-context";
import type { Product } from "@/types";
import { cn } from "@/lib/cn";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = {
  product: Product;
  open: boolean;
  onClose: () => void;
};

export function QuickViewModal({ product, open, onClose }: Props) {
  const { addLine } = useCart();
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [size, setSize] = useState(product.variants[0]?.size ?? "");
  const [color, setColor] = useState(product.variants[0]?.color ?? "");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open || product.images.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIdx((idx) => (idx + 1) % product.images.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [open, product.images.length]);

  const sizes = useMemo(
    () => [...new Set(product.variants.map((v) => v.size))],
    [product.variants],
  );
  const colors = useMemo(() => {
    const matchSize = product.variants.filter((v) => v.size === size);
    const pool = matchSize.length ? matchSize : product.variants;
    return [...new Set(pool.map((v) => v.color))];
  }, [product.variants, size]);
  const selected = useMemo(
    () =>
      product.variants.find((v) => v.size === size && v.color === color) ??
      product.variants.find((v) => v.size === size) ??
      product.variants[0],
    [color, product.variants, size],
  );

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-2 backdrop-blur-[2px] md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative h-[90vh] w-full max-w-[1120px] overflow-hidden rounded-[8px] bg-[#f6f4f1]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-20 rounded-full p-2 text-ink/70 transition hover:bg-black/5 hover:text-ink"
              aria-label="Close quick view"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid h-full grid-cols-1 md:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
              <div className="relative h-[48vh] bg-[#e8e0d6] md:h-full">
                <div className={cn("relative h-full w-full", storefrontImageShellClass)}>
                  {product.images[activeIdx] ? (
                    <Image
                      src={product.images[activeIdx]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      {...storefrontImageProps}
                    />
                  ) : null}
                </div>
                {product.images.length > 1 ? (
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto rounded-full bg-white/70 p-2 backdrop-blur">
                    {product.images.map((img, idx) => (
                      <button
                        key={`${img}-${idx}`}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={cn(
                          "relative h-14 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-transparent",
                          storefrontImageShellClass,
                          activeIdx === idx && "ring-gold",
                        )}
                      >
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                          {...storefrontImageProps}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="h-full overflow-y-auto border-l border-black/8 p-6 md:p-8">
                <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">
                  {product.category}
                </p>
                <h3 className="mt-2 pr-8 font-display text-[40px] leading-tight text-ink">{product.name}</h3>
                <p className="mt-2 font-sans text-[32px] leading-none text-ink">
                  Rs. {product.price.toLocaleString("en-IN")}.00
                </p>
                <p className="mt-5 line-clamp-3 font-sans text-sm leading-relaxed text-ink-muted">
                  {product.description}
                </p>
                <Link
                  href={`/products/${product.slug}`}
                  className="mt-3 inline-flex font-sans text-sm text-ink underline underline-offset-2"
                >
                  View details
                </Link>

                <div className="mt-6 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#d39c3f]" />
                  <p className="font-sans text-sm text-[#b38743]">
                    {selected && selected.stock > 0 ? "Low stock" : "Out of stock"}
                  </p>
                </div>

                <div className="mt-6">
                  <p className="font-sans text-xs uppercase tracking-[0.18em] text-ink-soft">Size: {size}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={cn(
                          "min-w-[40px] rounded-[4px] border px-3 py-2 font-sans text-xs transition",
                          size === s
                            ? "border-ink bg-ink text-ivory"
                            : "border-black/10 text-ink hover:border-black/25",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {colors.length > 1 ? (
                  <div className="mt-5">
                    <p className="font-sans text-xs uppercase tracking-[0.18em] text-ink-soft">Color</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.14em]",
                            color === c
                              ? "border-ink bg-ink text-ivory"
                              : "border-black/10 text-ink hover:border-black/25",
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex items-center gap-4">
                  <div className="inline-flex items-center rounded-[4px] border border-black/10 bg-white">
                    <button
                      type="button"
                      className="p-3"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-10 text-center font-sans text-sm">{qty}</span>
                    <button
                      type="button"
                      className="p-3"
                      onClick={() => setQty((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!selected || selected.stock <= 0}
                    onClick={() => {
                      if (!selected || selected.stock <= 0) return;
                      addLine({
                        productId: product._id,
                        name: product.name,
                        slug: product.slug,
                        image: product.images[0] ?? "",
                        price: product.price,
                        sku: selected.sku,
                        size: selected.size,
                        color: selected.color,
                        quantity: qty,
                      });
                      onClose();
                    }}
                    className="flex-1 rounded-[4px] border border-black/30 bg-transparent px-4 py-3 font-sans text-sm transition hover:border-black/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
