"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide, SectionDesign, SectionTextColors } from "@/types/homepage";
import { getEffectiveHeroSlideStyle } from "@/lib/cms/hero-slide-styles";
import {
  heroCtaStyle,
  heroHeadingStyle,
  heroKickerStyle,
  heroOverlayStyle,
  heroSubheadingStyle,
  mergeSectionDesign,
  mergeSectionTextColors,
  sectionDesignStyle,
} from "@/lib/cms/section-design";
import { sectionTextStyles } from "@/lib/section-text-styles";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { cn } from "@/lib/cn";
import { isValidImageSrc } from "@/lib/image-src";

const easeLux = [0.22, 1, 0.36, 1] as const;

type Props = {
  slides: HeroSlide[];
  autoplayMs: number;
  carouselStyles?: SectionDesign | null;
  /** CMS hex overrides for hero copy (fallback when slide has no override). */
  sectionText?: SectionTextColors | null;
};

export function HeroCarousel({ slides, autoplayMs, carouselStyles, sectionText }: Props) {
  const active = [...slides]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);
  const slideDirection = useRef<1 | -1>(1);
  const touchStart = useRef(0);

  const count = active.length || 1;
  const safeIndex = ((index % count) + count) % count;
  const slide = active[safeIndex] ?? active[0];
  const effective = slide ? getEffectiveHeroSlideStyle(slides, slide.id) : {};

  const slideDesign = mergeSectionDesign(carouselStyles, effective.styles);
  const mergedText = mergeSectionTextColors(sectionText, effective.textColors);
  const st = sectionTextStyles(mergedText);
  const overlayCustom = heroOverlayStyle(slideDesign);
  const sectionStyle = sectionDesignStyle(slideDesign);

  const go = useCallback(
    (dir: -1 | 1) => {
      slideDirection.current = dir;
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const ms = Math.max(4000, autoplayMs || 12_000);
    const t = window.setInterval(() => {
      slideDirection.current = 1;
      setIndex((i) => (i + 1) % count);
    }, ms);
    return () => window.clearInterval(t);
  }, [count, autoplayMs]);

  const copyMotion = {
    initial: (dir: number) => ({
      opacity: 0,
      y: dir >= 0 ? 32 : -32,
    }),
    animate: { opacity: 1, y: 0 },
    exit: (dir: number) => ({
      opacity: 0,
      y: dir >= 0 ? -24 : 24,
    }),
  };

  if (!slide) {
    return (
      <section className="relative min-h-[var(--store-hero-min-h)] bg-[#f2efe9]">
        <div className="flex min-h-[var(--store-hero-min-h)] items-center justify-center font-display text-xl font-light text-ink-muted">
          Add hero slides in the admin studio.
        </div>
      </section>
    );
  }

  const desktop = slide.desktopImage?.trim() ?? "";
  const mobile = slide.mobileImage?.trim() || desktop;
  const hasHeroImage = isValidImageSrc(desktop) || isValidImageSrc(mobile);
  const imgSrc = isValidImageSrc(desktop) ? desktop : mobile;
  const SITE_NAME = "Naya Story";
  const kickerText = slide.kicker?.trim() || `${SITE_NAME} — ${String(safeIndex + 1).padStart(2, "0")}`;
  const alignClass =
    slideDesign?.align === "center"
      ? "text-center items-center"
      : slideDesign?.align === "right"
        ? "text-right items-end"
        : "text-left";

  return (
    <section
      key={slide.id}
      className="relative min-h-[var(--store-hero-min-h)] overflow-hidden bg-[#f2efe9] transition-[background-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={sectionStyle}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.25, ease: easeLux }}
          className="absolute inset-0"
        >
          {hasHeroImage ? (
            <picture className="absolute inset-0">
              {isValidImageSrc(mobile) && mobile !== imgSrc ? (
                <source media="(max-width: 768px)" srcSet={mobile} />
              ) : null}
              <img
                src={imgSrc}
                alt=""
                className="h-full w-full object-cover object-center animate-slow-zoom"
              />
            </picture>
          ) : (
            <div className="absolute inset-0">
              <MediaPlaceholder label="Add hero image in admin" />
            </div>
          )}
          {overlayCustom ? (
            <div className="pointer-events-none absolute inset-0" style={overlayCustom} aria-hidden />
          ) : (
            <>
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/48 via-ink/12 to-transparent md:hidden"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-[min(55%,500px)] bg-gradient-to-r from-ink/45 via-ink/10 to-transparent md:block"
                aria-hidden
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="pointer-events-none absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-14 md:gap-3"
        aria-hidden
      >
        <span className="font-sans text-[9px] uppercase tracking-[0.32em] text-ivory/55 sm:tracking-[0.4em]">
          Scroll
        </span>
        <span className="h-10 w-px bg-ivory/45 animate-scroll-line md:h-12" />
      </motion.div>

      <div
        className={cn(
          "relative z-10 lux-shell flex min-h-[var(--store-hero-min-h)] flex-col justify-end pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-20 sm:pb-24 sm:pt-24 md:grid md:grid-cols-12 md:items-end md:pb-28 md:pt-28",
          alignClass,
        )}
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
        <AnimatePresence mode="wait" custom={slideDirection.current}>
          <motion.div
            key={slide.id + "-copy"}
            custom={slideDirection.current}
            variants={copyMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.85, ease: easeLux }}
            className={cn(
              "max-w-3xl text-balance md:col-span-7 md:max-w-none [text-shadow:0_2px_40px_rgba(0,0,0,0.35)]",
              slideDesign?.align === "center" && "mx-auto",
              slideDesign?.align === "right" && "md:col-start-6",
            )}
            style={slideDesign?.maxWidth ? { maxWidth: slideDesign.maxWidth } : undefined}
          >
            <p
              className="lux-hero-kicker [text-shadow:0_1px_24px_rgba(0,0,0,0.35)]"
              style={heroKickerStyle(slideDesign, st.kicker)}
            >
              {kickerText}
            </p>
            <h1
              className="lux-hero-title mt-3 sm:mt-4 [text-shadow:0_2px_40px_rgba(0,0,0,0.35)]"
              style={heroHeadingStyle(slideDesign, st.heading)}
            >
              {slide.heading}
            </h1>
            {slide.subheading ? (
              <p
                className="lux-hero-sub mt-5 max-w-xl [text-shadow:0_1px_20px_rgba(0,0,0,0.3)]"
                style={heroSubheadingStyle(slideDesign, st.subheading)}
              >
                {slide.subheading}
              </p>
            ) : null}
            {slide.ctaLabel ? (
              <div className="mt-8 flex flex-wrap gap-3 sm:mt-11 sm:gap-4">
                <Link
                  href={slide.ctaHref || "/collections"}
                  className="lux-hero-cta"
                  style={heroCtaStyle(slideDesign, st.link)}
                >
                  {slide.ctaLabel}
                </Link>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
        {slide.metaLabel?.trim() ? (
          <motion.div
            key={slide.id + "-meta"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-6 max-w-xs md:col-span-4 md:col-start-9 md:mt-0 md:pb-2 md:text-right"
          >
            <p
              className="lux-hero-kicker text-ivory/55"
              style={heroKickerStyle(slideDesign, st.kicker)}
            >
              {slide.metaLabel}
            </p>
          </motion.div>
        ) : null}
      </div>

      {count > 1 ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-20 flex justify-between px-4 sm:bottom-10 sm:justify-start sm:px-6 md:bottom-14 md:px-12 lg:px-16">
            <div className="flex gap-2" style={{ pointerEvents: "auto" }}>
              {active.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "lux-hero-dot",
                    i === safeIndex ? "w-9 bg-ivory" : "w-1.5 bg-ivory/30 hover:bg-ivory/50",
                  )}
                  onClick={() => {
                    const forward = (i - safeIndex + count) % count;
                    slideDirection.current =
                      forward === 0 ? 1 : forward <= count / 2 ? 1 : -1;
                    setIndex(i);
                  }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            aria-label="Previous slide"
            className="lux-hero-nav absolute left-2 top-1/2 z-20 -translate-y-1/2 sm:left-3 md:left-6"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.05} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="lux-hero-nav absolute right-2 top-1/2 z-20 -translate-y-1/2 sm:right-3 md:right-6"
            onClick={() => go(1)}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.05} />
          </button>
        </>
      ) : null}
    </section>
  );
}
