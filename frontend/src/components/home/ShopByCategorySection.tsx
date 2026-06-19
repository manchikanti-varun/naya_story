"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import type { CategoryCard, SectionDesign, SectionTextColors } from "@/types/homepage";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { SectionShell } from "@/components/cms/SectionShell";
import { sectionTextStyles } from "@/lib/section-text-styles";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { cn } from "@/lib/cn";
import { isNextImageSrc } from "@/lib/image-src";

type Props = {
  title: string;
  subtitle: string;
  kicker?: string;
  items: CategoryCard[];
  cta?: { label: string; href: string };
  compactTop?: boolean;
  sectionText?: SectionTextColors | null;
  design?: SectionDesign | null;
};

const desktopCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.12,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function ShopByCategorySection({
  title,
  subtitle,
  kicker,
  items,
  cta,
  compactTop = false,
  sectionText,
  design,
}: Props) {
  const visible = [...items]
    .filter((c) => c.enabled)
    .sort((a, b) => a.order - b.order);

  const st = sectionTextStyles(sectionText);

  if (visible.length === 0) return null;

  return (
    <SectionShell
      design={design ? { ...design, align: undefined } : undefined}
      className={cn(
        !design?.backgroundColor && "bg-ivory-muted/60",
        compactTop ? "pt-8 pb-10 md:pt-10 md:pb-14" : "py-10 md:py-14",
      )}
    >
      <div className="lux-shell text-center">
        <HomeSectionHeader
          kicker={kicker}
          title={title}
          subtitle={subtitle}
          align={design?.align ?? "left"}
          design={design}
          sectionText={sectionText}
          className="mb-6 sm:mb-8 md:mb-10"
        />
      </div>

      {/* Mobile: Spread/fan cards */}
      <div className="sm:hidden">
        <MobileSpreadCards items={visible} />
      </div>

      {/* Desktop: Grid layout */}
      <div className="lux-shell hidden sm:block">
        <div
          className="grid gap-4 md:gap-5 mx-auto max-w-4xl"
          style={{
            gridTemplateColumns: `repeat(${Math.min(visible.length, 3)}, 1fr)`,
          }}
          role="list"
          aria-label="Shop by category"
        >
          {visible.map((cat, i) => (
            <motion.div
              key={cat.id}
              role="listitem"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={desktopCardVariants}
            >
              <DesktopCard cat={cat} />
            </motion.div>
          ))}
        </div>
      </div>

      {cta ? (
        <div className="lux-shell mt-8 flex justify-center">
          <Link href={cta.href} className="lux-btn-outline" style={st.link}>
            {cta.label}
          </Link>
        </div>
      ) : null}
    </SectionShell>
  );
}

/** Mobile: Stacked spread cards you can swipe through */
function MobileSpreadCards({ items }: { items: CategoryCard[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative px-4 py-4">
      {/* Card stack container */}
      <div
        ref={constraintsRef}
        className="relative mx-auto h-[340px] w-[240px]"
      >
        {items.map((cat, i) => {
          const offset = i - activeIndex;
          const isActive = i === activeIndex;
          const isBehind = offset > 0;
          const isGone = offset < 0;

          return (
            <motion.div
              key={cat.id}
              className="absolute inset-0 cursor-pointer"
              animate={{
                scale: isActive ? 1 : isBehind ? 1 - offset * 0.06 : 0.9,
                y: isActive ? 0 : isBehind ? offset * -12 : -30,
                x: isActive ? 0 : isBehind ? offset * 8 : -80,
                rotateZ: isActive ? 0 : isBehind ? offset * 3 : -5,
                opacity: isGone ? 0 : isBehind && offset > 3 ? 0 : 1,
                zIndex: items.length - Math.abs(offset),
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
              }}
              drag={isActive ? "x" : false}
              dragConstraints={{ left: -100, right: 100 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 60) {
                  if (info.offset.x < 0 && activeIndex < items.length - 1) {
                    setActiveIndex(activeIndex + 1);
                  } else if (info.offset.x > 0 && activeIndex > 0) {
                    setActiveIndex(activeIndex - 1);
                  }
                }
              }}
              onClick={() => {
                if (!isActive && i > activeIndex) setActiveIndex(i);
              }}
            >
              <Link
                href={cat.href || "/collections"}
                className="block h-full w-full"
                onClick={(e) => { if (!isActive) e.preventDefault(); }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-2xl bg-ivory-soft shadow-[0_8px_40px_-8px_rgba(44,40,37,0.2)] ring-1 ring-ivory-deep/20">
                  {isNextImageSrc(cat.image) ? (
                    <Image
                      src={cat.image.trim()}
                      alt={cat.name}
                      fill
                      loading="lazy"
                      className="object-cover object-center"
                      sizes="240px"
                      unoptimized={!cat.image.includes("res.cloudinary.com")}
                    />
                  ) : (
                    <MediaPlaceholder />
                  )}

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/15 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5">
                    <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-ivory/60">
                      Collection
                    </span>
                    <h3 className="mt-1 font-display text-xl text-ivory">
                      {cat.name}
                    </h3>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-[0.18em] text-ivory/80"
                      >
                        Shop now
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </motion.span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Dots indicator */}
      <div className="mt-5 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`View category ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeIndex ? "w-6 bg-ink" : "w-1.5 bg-ink/20",
            )}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

/** Desktop: Standard card with hover effects */
function DesktopCard({ cat }: { cat: CategoryCard }) {
  return (
    <Link href={cat.href || "/collections"} className="group relative block">
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ivory-soft shadow-[0_2px_16px_-4px_rgba(44,40,37,0.08)] ring-1 ring-ivory-deep/15 transition-shadow duration-500 group-hover:shadow-[0_8px_32px_-6px_rgba(44,40,37,0.14)] group-hover:ring-gold/25"
      >
        {isNextImageSrc(cat.image) ? (
          <Image
            src={cat.image.trim()}
            alt={cat.name}
            fill
            loading="lazy"
            className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            sizes="(max-width:768px) 50vw, 30vw"
            unoptimized={!cat.image.includes("res.cloudinary.com")}
          />
        ) : (
          <MediaPlaceholder />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
          <h3 className="font-display text-lg text-ivory transition-transform duration-500 ease-out group-hover:-translate-y-0.5 md:text-xl">
            {cat.name}
          </h3>

          {/* Animated underline on hover */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-px w-0 bg-ivory/70 transition-all duration-500 ease-out group-hover:w-8" />
            <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-ivory/70 opacity-0 transition-all duration-400 delay-100 group-hover:opacity-100">
              Shop
            </span>
            <svg
              className="h-3 w-3 -translate-x-1 text-ivory/70 opacity-0 transition-all duration-400 delay-150 group-hover:translate-x-0 group-hover:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
