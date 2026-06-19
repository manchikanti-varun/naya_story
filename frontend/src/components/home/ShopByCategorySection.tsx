"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.12,
      ease: [0.22, 1, 0.36, 1],
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

      {/* Compact category cards — horizontal scroll on mobile, grid on desktop */}
      <div className="lux-shell">
        {/* Mobile: horizontal scrollable row */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide sm:hidden snap-x snap-mandatory">
          {visible.map((cat, i) => (
            <motion.div
              key={cat.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-20px" }}
              variants={cardVariants}
              className="shrink-0 snap-center first:ml-1 last:mr-1"
              style={{ width: "70vw", maxWidth: "260px" }}
            >
              <CategoryCardItem cat={cat} />
            </motion.div>
          ))}
        </div>

        {/* Tablet+: grid layout */}
        <div
          className="hidden sm:grid gap-4 md:gap-5"
          style={{
            gridTemplateColumns: visible.length <= 3
              ? `repeat(${visible.length}, 1fr)`
              : "repeat(auto-fill, minmax(200px, 1fr))",
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
              variants={cardVariants}
            >
              <CategoryCardItem cat={cat} />
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

function CategoryCardItem({ cat }: { cat: CategoryCard }) {
  return (
    <Link href={cat.href || "/collections"} className="group relative block">
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ivory-soft shadow-[0_2px_16px_-4px_rgba(44,40,37,0.08)] ring-1 ring-ivory-deep/15 transition-shadow duration-500 group-hover:shadow-[0_8px_32px_-6px_rgba(44,40,37,0.14)] group-hover:ring-gold/25"
      >
        {/* Image */}
        {isNextImageSrc(cat.image) ? (
          <Image
            src={cat.image.trim()}
            alt={cat.name}
            fill
            loading="lazy"
            className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            sizes="(max-width:640px) 70vw, (max-width:768px) 45vw, 30vw"
            unoptimized={!cat.image.includes("res.cloudinary.com")}
          />
        ) : (
          <MediaPlaceholder />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h3 className="font-display text-lg text-ivory transition-transform duration-500 ease-out group-hover:-translate-y-0.5 sm:text-xl">
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
