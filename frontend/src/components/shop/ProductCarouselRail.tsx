"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/** Pixels per second for continuous marquee (slower when reduced motion) */
const SCROLL_PX_PER_SEC = 48;
const SCROLL_PX_PER_SEC_REDUCED = 14;

/** Enough copies that scrollWidth reliably exceeds viewport for seamless wrap */
const LOOP_COPIES = 3;

type Props = {
  products: Product[];
  className?: string;
  eyebrow?: string;
  title?: string;
};

type LoopItem = { product: Product; key: string };

function buildLoopItems(products: Product[]): LoopItem[] {
  if (products.length <= 1) {
    return products.map((p) => ({ product: p, key: p._id }));
  }
  const items: LoopItem[] = [];
  for (let copy = 0; copy < LOOP_COPIES; copy += 1) {
    products.forEach((p, i) => {
      items.push({ product: p, key: `${p._id}-loop-${copy}-${i}` });
    });
  }
  return items;
}

export function ProductCarouselRail({ products, className, eyebrow, title }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const loopWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const reduced = useReducedMotion();

  const loopItems = useMemo(() => buildLoopItems(products), [products]);
  const isInfinite = products.length > 1;

  const getStep = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return 280;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    if (!card) return el.clientWidth * 0.85;
    const track = trackRef.current;
    const gapSource = track ?? el;
    const gap =
      parseFloat(getComputedStyle(gapSource).columnGap || getComputedStyle(gapSource).gap || "20") ||
      20;
    return card.offsetWidth + gap;
  }, []);

  const measureLoopWidth = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !isInfinite) {
      loopWidthRef.current = 0;
      return;
    }
    const sw = el.scrollWidth;
    if (sw <= 0) return;
    loopWidthRef.current = Math.floor(sw / LOOP_COPIES);
  }, [isInfinite]);

  const wrapScrollPosition = useCallback(() => {
    const el = scrollerRef.current;
    const loopWidth = loopWidthRef.current;
    if (!el || loopWidth <= 0) return;
    if (el.scrollLeft >= loopWidth - 0.5) {
      el.scrollLeft -= loopWidth;
    } else if (el.scrollLeft < 0) {
      el.scrollLeft += loopWidth;
    }
  }, []);

  const scrollByStep = useCallback(
    (dir: 1 | -1) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollBy({ left: dir * getStep(), behavior: reduced ? "auto" : "smooth" });
    },
    [getStep, reduced],
  );

  useLayoutEffect(() => {
    measureLoopWidth();
  }, [loopItems, measureLoopWidth]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    measureLoopWidth();
    const onScroll = () => wrapScrollPosition();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      measureLoopWidth();
      wrapScrollPosition();
    });
    ro.observe(el);
    if (trackRef.current) ro.observe(trackRef.current);
    const imgs = el.querySelectorAll("img");
    const onImg = () => {
      measureLoopWidth();
      wrapScrollPosition();
    };
    imgs.forEach((img) => img.addEventListener("load", onImg, { passive: true }));
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", onImg));
    };
  }, [loopItems, measureLoopWidth, wrapScrollPosition]);

  useEffect(() => {
    if (!isInfinite) return;

    const pxPerSec = reduced ? SCROLL_PX_PER_SEC_REDUCED : SCROLL_PX_PER_SEC;

    const tick = (now: number) => {
      const el = scrollerRef.current;
      if (el && !pausedRef.current) {
        const last = lastFrameRef.current ?? now;
        lastFrameRef.current = now;
        const dt = Math.min(now - last, 48);
        el.scrollLeft += (pxPerSec * dt) / 1000;
        wrapScrollPosition();
      } else {
        lastFrameRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [reduced, isInfinite, wrapScrollPosition]);

  if (products.length === 0) return null;

  const showNav = products.length > 1;

  const navButtons = showNav ? (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        aria-label="Scroll related products left"
        onClick={() => scrollByStep(-1)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border border-ivory-deep/80 bg-ivory text-ink shadow-sm transition",
          "hover:border-gold/50 hover:text-gold",
        )}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.25} aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Scroll related products right"
        onClick={() => scrollByStep(1)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border border-ivory-deep/80 bg-ivory text-ink shadow-sm transition",
          "hover:border-gold/50 hover:text-gold",
        )}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={1.25} aria-hidden />
      </button>
    </div>
  ) : null;

  return (
    <section className={cn(className)}>
      {eyebrow || title ? (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            {eyebrow ? <p className="lux-kicker">{eyebrow}</p> : null}
            {title ? (
              <h2
                className={cn(
                  "lux-heading-rail",
                  eyebrow && "mt-2",
                )}
              >
                {title}
              </h2>
            ) : null}
          </div>
          {navButtons}
        </div>
      ) : null}

      <div className="relative overflow-hidden">
        {!eyebrow && !title && showNav ? (
          <>
            <button
              type="button"
              aria-label="Scroll related products left"
              onClick={() => scrollByStep(-1)}
              className={cn(
                "absolute -left-1 top-[38%] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory-deep/80 bg-ivory/95 text-ink shadow-lux backdrop-blur-sm sm:left-0",
                "hover:border-gold/50 hover:text-gold",
              )}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.25} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Scroll related products right"
              onClick={() => scrollByStep(1)}
              className={cn(
                "absolute -right-1 top-[38%] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory-deep/80 bg-ivory/95 text-ink shadow-lux backdrop-blur-sm sm:right-0",
                "hover:border-gold/50 hover:text-gold",
              )}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.25} aria-hidden />
            </button>
          </>
        ) : null}

        {/* snap-none: .lux-scroll-x sets scroll-snap-type, which fights programmatic scrollLeft */}
        <div
          ref={scrollerRef}
          className="overflow-x-auto overscroll-x-contain pb-2 pt-1 no-scrollbar"
          style={{ scrollSnapType: "none", WebkitOverflowScrolling: "touch" }}
          tabIndex={0}
          aria-label="Related products carousel"
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
            lastFrameRef.current = null;
          }}
          onFocusCapture={() => {
            pausedRef.current = true;
          }}
          onBlurCapture={() => {
            pausedRef.current = false;
            lastFrameRef.current = null;
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") scrollByStep(-1);
            if (e.key === "ArrowRight") scrollByStep(1);
          }}
        >
          <div ref={trackRef} className="flex w-max gap-5 md:gap-6">
            {loopItems.map(({ product, key }) => (
              <div
                key={key}
                data-carousel-card
                className="w-[min(68vw,200px)] shrink-0 sm:w-[190px] md:w-[220px] lg:w-[240px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--background)] to-transparent sm:w-12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent sm:w-12"
          aria-hidden
        />
      </div>
    </section>
  );
}
