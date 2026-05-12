"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/context/cart-context";
import type { Product } from "@/types";
import { cn } from "@/lib/cn";
import { ProductCard } from "@/components/shop/ProductCard";
import { storefrontImageProps, storefrontImageShellClass } from "@/lib/media-protection";

type Props = { slug: string; /** When set, loads product via admin API (includes hidden). */ adminPreviewToken?: string | null };

export function ProductDetail({ slug, adminPreviewToken }: Props) {
  const { addLine } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("fabric");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const path = adminPreviewToken
          ? `/admin/products/slug/${slug}`
          : `/products/slug/${slug}`;
        const data = await apiFetch<{ product: Product; related: Product[] }>(path, {
          token: adminPreviewToken ?? undefined,
        });
        if (cancelled) return;
        setProduct(data.product);
        setRelated(data.related);
        const v0 = data.product.variants[0];
        if (v0) {
          setSize(v0.size);
          setColor(v0.color);
        }
      } catch {
        if (!cancelled) setProduct(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, adminPreviewToken]);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen]);

  const variant = useMemo(() => {
    if (!product) return null;
    return (
      product.variants.find((v) => v.size === size && v.color === color) ??
      product.variants.find((v) => v.size === size) ??
      product.variants[0]
    );
  }, [product, size, color]);

  const sizes = useMemo(() => {
    if (!product) return [];
    return [...new Set(product.variants.map((v) => v.size))];
  }, [product]);

  const colors = useMemo(() => {
    if (!product) return [];
    const matchSize = product.variants.filter((v) => v.size === size);
    const pool = matchSize.length ? matchSize : product.variants;
    return [...new Set(pool.map((v) => v.color))];
  }, [product, size]);

  if (!product) {
    return (
      <div className="lux-shell py-32">
        <p className="font-sans text-sm text-ink-muted">
          This piece is no longer on the rails —{" "}
          <Link href="/collections" className="text-gold underline-offset-4 hover:underline">
            return to collections
          </Link>
          .
        </p>
      </div>
    );
  }

  const image = product.images[activeIdx] ?? product.images[0];
  const canAdd = variant && variant.stock > 0;

  return (
    <div className="lux-shell pb-24 pt-6 md:pb-32 md:pt-8">
      {adminPreviewToken ? (
        <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 font-sans text-xs text-amber-950 md:text-sm">
          <span className="font-medium">Admin preview</span>
          <span className="text-amber-800"> — matches live product styling. Hidden products only appear here.</span>
        </div>
      ) : null}
      <div className="mb-8 border-b border-ivory-deep pb-5 md:mb-10">
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-ink-soft">
          Collections / {product.category}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className={cn(
              "relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-ivory-soft",
              storefrontImageShellClass,
            )}
          >
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                priority
                className="object-cover transition duration-[1.2s] hover:scale-[1.03]"
                sizes="(max-width:1024px) 100vw, 55vw"
                {...storefrontImageProps}
              />
            ) : null}
          </button>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {product.images.slice(0, 6).map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "relative aspect-[4/5] overflow-hidden rounded-xl ring-2 ring-transparent transition",
                  storefrontImageShellClass,
                  activeIdx === i && "ring-gold",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 33vw, 18vw"
                  {...storefrontImageProps}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold/95">
            {product.category}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.35rem,4vw,3.5rem)] leading-[1.02] tracking-[-0.02em] text-ink">
            {product.name}
          </h1>
          <div className="mt-6 flex flex-wrap items-baseline gap-4 border-b border-ivory-deep pb-7">
            <span className="font-sans text-2xl tracking-wide text-ink">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="font-sans text-sm text-ink-soft line-through">
                ₹{product.compareAtPrice.toLocaleString("en-IN")}
              </span>
            ) : null}
          </div>

          <p className="mt-7 font-sans text-[15px] leading-relaxed text-ink-muted md:text-base">
            {product.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="rounded-full border border-ivory-deep bg-ivory/70 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              Studio crafted
            </span>
            <span className="rounded-full border border-ivory-deep bg-ivory/70 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              Premium finish
            </span>
            <span className="rounded-full border border-ivory-deep bg-ivory/70 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              Limited run
            </span>
          </div>

          <div className="mt-10 space-y-6 rounded-[24px] border border-ivory-deep/80 bg-[#fbf8f3]/92 p-6 shadow-[0_18px_44px_-28px_rgba(44,40,37,0.35)] backdrop-blur md:p-7">
            <div className="flex items-center justify-between border-b border-ivory-deep/70 pb-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-ink-soft">
                Choose options
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                {canAdd ? "In stock" : "Sold out"}
              </p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.26em] text-ink-soft">
                Size
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-w-[52px] rounded-full border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em]",
                      size === s
                        ? "border-gold bg-gold text-white"
                        : "border-ivory-deep text-ink-muted hover:border-gold hover:text-gold",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.26em] text-ink-soft">
                Color
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "rounded-full border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em]",
                      color === c
                        ? "border-gold bg-gold text-white"
                        : "border-ivory-deep text-ink-muted hover:border-gold hover:text-gold",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-ivory-deep px-3 py-2">
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-ivory-soft"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2rem] text-center font-sans text-sm">{qty}</span>
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-ivory-soft"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="font-sans text-xs text-ink-soft">
                {variant && variant.stock > 0 ? (
                  <>
                    Ships in <span className="text-ink">3–5 days</span> · {variant.stock}{" "}
                    left in studio
                  </>
                ) : (
                  <span className="text-gold">Awaiting restock</span>
                )}
              </p>
            </div>

            <button
              type="button"
              disabled={!canAdd}
              onClick={() => {
                if (!variant || !canAdd) return;
                addLine({
                  productId: product._id,
                  name: product.name,
                  slug: product.slug,
                  image: product.images[0] ?? "",
                  price: product.price,
                  sku: variant.sku,
                  size: variant.size,
                  color: variant.color,
                  quantity: qty,
                });
              }}
              className="w-full rounded-full bg-ink py-4 font-sans text-[11px] uppercase tracking-[0.3em] text-ivory transition-all duration-500 hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to bag
            </button>
            <p className="text-center font-sans text-[11px] text-ink-soft">
              Secure checkout · Easy exchanges
            </p>
          </div>

          <div className="mt-10 divide-y divide-ivory-deep border-y border-ivory-deep/90">
            <AccordionRow
              title="Fabric & finish"
              open={openSection === "fabric"}
              onToggle={() =>
                setOpenSection(openSection === "fabric" ? null : "fabric")
              }
            >
              <p className="pb-5 font-sans text-sm leading-relaxed text-ink-muted">
                {product.fabricDetails ??
                  "Italian silk blend with a satin-back hand — cold touch, warm drape. Fully lined in breathable cupro."}
              </p>
            </AccordionRow>
            <AccordionRow
              title="Styling notes"
              open={openSection === "styling"}
              onToggle={() =>
                setOpenSection(openSection === "styling" ? null : "styling")
              }
            >
              <p className="pb-5 font-sans text-sm leading-relaxed text-ink-muted">
                {product.stylingSuggestions ??
                  "Pair with elongated earrings and a scent that lingers close to the skin — daylight dinners, gallery evenings."}
              </p>
            </AccordionRow>
            <AccordionRow
              title="Delivery & care"
              open={openSection === "care"}
              onToggle={() =>
                setOpenSection(openSection === "care" ? null : "care")
              }
            >
              <p className="pb-5 font-sans text-sm leading-relaxed text-ink-muted">
                Complimentary shipping over ₹15,000. Dry clean only — store on a padded hanger away from direct sunlight.
              </p>
            </AccordionRow>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-24 border-t border-ivory-deep pt-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-ink-soft">
                Continue exploring
              </p>
              <h2 className="mt-2 font-display text-3xl text-ink">Related silhouettes</h2>
            </div>
            <Link
              href={`/collections?category=${product.category}`}
              className="hidden font-sans text-[11px] uppercase tracking-[0.24em] text-ink-muted hover:text-gold md:inline"
            >
              View category
            </Link>
          </div>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <AnimatePresence>
        {zoomOpen && image ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/80 p-4 pb-10 pt-14 backdrop-blur-sm sm:p-6 sm:pb-12 sm:pt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomOpen(false)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomOpen(false);
              }}
              className="fixed right-4 top-4 z-[95] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/95 text-ink shadow-lg transition hover:bg-white"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[28px] shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn("relative aspect-[3/4] bg-black", storefrontImageShellClass)}>
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  {...storefrontImageProps}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AccordionRow({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left font-display text-xl text-ink"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform duration-300",
            open ? "rotate-180" : "",
          )}
          strokeWidth={1.25}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
