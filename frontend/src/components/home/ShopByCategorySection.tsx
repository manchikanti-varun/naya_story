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
        compactTop ? "pt-8 pb-12 md:pt-10 md:pb-16" : "py-12 md:py-16",
      )}
    >
      <div className="lux-shell text-center">
        <HomeSectionHeader
          kicker={kicker}
          title={title}
          subtitle={subtitle}
          align="center"
          design={design}
          sectionText={sectionText}
          className="mb-8 sm:mb-10 md:mb-12"
        />
      </div>

      {/* Premium category cards */}
      <div className="lux-shell">
        <div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6"
          role="list"
          aria-label="Shop by category"
        >
          {visible.map((cat, i) => (
            <motion.div
              key={cat.id}
              role="listitem"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={cat.href || "/collections"} className="group relative block">
                {/* Card container */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-soft shadow-[0_4px_24px_-4px_rgba(44,40,37,0.08)] ring-1 ring-ivory-deep/20 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-[0_12px_48px_-8px_rgba(44,40,37,0.15)] group-hover:ring-gold/30">
                  {/* Image */}
                  {isNextImageSrc(cat.image) ? (
                    <Image
                      src={cat.image.trim()}
                      alt={cat.name}
                      fill
                      loading="lazy"
                      className="object-cover object-center transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      sizes="(max-width:640px) 100vw, (max-width:768px) 50vw, 33vw"
                      unoptimized={!cat.image.includes("res.cloudinary.com")}
                    />
                  ) : (
                    <MediaPlaceholder />
                  )}

                  {/* Gradient overlay — always visible at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent transition-opacity duration-700 group-hover:from-ink/80 group-hover:via-ink/30" />

                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                    {/* Category name — always visible */}
                    <h3 className="font-display text-xl text-ivory transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 sm:text-2xl">
                      {cat.name}
                    </h3>

                    {/* Hover details */}
                    <div className="mt-2 flex items-center gap-2 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
                      <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-ivory/80">
                        Explore collection
                      </span>
                      <svg
                        className="h-3.5 w-3.5 text-ivory/80 transition-transform duration-500 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {cta ? (
        <div className="lux-shell mt-10 flex justify-center">
          <Link href={cta.href} className="lux-btn-outline" style={st.link}>
            {cta.label}
          </Link>
        </div>
      ) : null}
    </SectionShell>
  );
}
