"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide, SectionTextColors } from "@/types/homepage";
import { sectionTextStyles } from "@/lib/section-text-styles";
import { cn } from "@/lib/cn";

const easeLux = [0.22, 1, 0.36, 1] as const;

type Props = {
  slides: HeroSlide[];
  autoplayMs: number;
  /** CMS hex overrides for hero copy (kicker, heading, subheading, link). */
  sectionText?: SectionTextColors | null;
};

export function HeroCarousel({ slides, autoplayMs, sectionText }: Props) {
  const active = [...slides]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);
  const touchStart = useRef(0);

  const count = active.length || 1;
  const safeIndex = ((index % count) + count) % count;
  const slide = active[safeIndex] ?? active[0];
  const st = sectionTextStyles(sectionText);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + count * 10) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const ms = Math.max(10_000, autoplayMs || 12_000);
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => window.clearInterval(t);
  }, [count, autoplayMs]);

  if (!slide) {
    return (
      <section className="relative min-h-[100svh] bg-[#f2efe9] md:min-h-[100dvh]">
        <div className="flex min-h-[100svh] items-center justify-center font-display text-2xl font-light text-ink-muted md:min-h-[100dvh]">
          Add hero slides in the admin studio.
        </div>
      </section>
    );
  }

  const desktop = slide.desktopImage?.trim() || "";
  const mobile = slide.mobileImage?.trim() || desktop;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#f2efe9] md:min-h-[100dvh]">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.25, ease: easeLux }}
          className="absolute inset-0"
        >
          <picture className="absolute inset-0">
            <source media="(max-width: 768px)" srcSet={mobile} />
            <img
              src={desktop}
              alt=""
              className="h-full w-full object-cover object-center animate-slow-zoom"
            />
          </picture>
          {/* Image-forward: no ivory wash — mobile: soft bottom veil; desktop: narrow left legibility */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/48 via-ink/12 to-transparent md:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[min(55%,500px)] bg-gradient-to-r from-ink/45 via-ink/10 to-transparent md:block"
            aria-hidden
          />
        </motion.div>
      </AnimatePresence>

      <div
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-end px-6 pb-32 pt-28 text-left md:min-h-[100dvh] md:px-12 md:pb-40 md:pt-32 lg:px-16"
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]?.clientX ?? 0;
        }}
        onTouchEnd={(e) => {
          const x = e.changedTouches[0]?.clientX ?? 0;
          const d = x - touchStart.current;
          if (d < -48) go(1);
          if (d > 48) go(-1);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id + "-copy"}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.15, ease: easeLux }}
            className="max-w-3xl text-balance md:max-w-[42rem] [text-shadow:0_2px_40px_rgba(0,0,0,0.35)]"
          >
            <p
              className="font-sans text-[10px] font-light uppercase tracking-[0.48em] text-ivory/80"
              style={st.kicker}
            >
              Naya Studio
            </p>
            <h1
              className="mt-5 font-display text-[clamp(2.35rem,6.2vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-ivory"
              style={st.heading}
            >
              {slide.heading}
            </h1>
            {slide.subheading ? (
              <p
                className="mt-5 max-w-xl font-sans text-[15px] font-light leading-relaxed text-ivory/90 md:text-base"
                style={st.subheading}
              >
                {slide.subheading}
              </p>
            ) : null}
            {slide.ctaLabel ? (
              <div className="mt-11 flex flex-wrap gap-4">
                <Link
                  href={slide.ctaHref || "/collections"}
                  className="rounded-full border border-ivory/45 bg-transparent px-9 py-3.5 font-sans text-[11px] font-light uppercase tracking-[0.3em] text-ivory transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold/80 hover:text-gold md:px-11 md:py-4"
                  style={st.link}
                >
                  {slide.ctaLabel}
                </Link>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-start px-6 md:bottom-14 md:px-12 lg:px-16">
            <div className="flex gap-2" style={{ pointerEvents: "auto" }}>
              {active.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "h-1 rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    i === safeIndex ? "w-9 bg-ivory" : "w-1.5 bg-ivory/30 hover:bg-ivory/50",
                  )}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-ivory/20 bg-ink/15 p-3 text-ivory/90 backdrop-blur-sm transition-all duration-700 hover:border-gold/40 hover:text-gold md:left-6 md:block"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.05} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-ivory/20 bg-ink/15 p-3 text-ivory/90 backdrop-blur-sm transition-all duration-700 hover:border-gold/40 hover:text-gold md:right-6 md:block"
            onClick={() => go(1)}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.05} />
          </button>
        </>
      ) : null}
    </section>
  );
}
