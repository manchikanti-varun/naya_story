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
        compactTop ? "pt-10 pb-section md:pt-14" : "py-section",
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
          className="mb-10 sm:mb-14 md:mb-16"
        />
      </div>

      {/* Category grid — same layout as product cards */}
      <div className="lux-shell">
        <div
          className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:gap-6"
          role="list"
          aria-label="Shop by category"
        >
          {visible.map((cat, i) => (
            <motion.div
              key={cat.id}
              role="listitem"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.95, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={cat.href || "/collections"} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lux bg-ivory-soft shadow-lux ring-1 ring-ivory-deep/30 transition-[box-shadow,ring-color] duration-700 group-hover:shadow-lux-hover group-hover:ring-gold/28">
                  {isNextImageSrc(cat.image) ? (
                    <Image
                      src={cat.image.trim()}
                      alt={cat.name}
                      fill
                      loading="lazy"
                      className="object-cover object-center transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      sizes="(max-width:768px) 50vw, 33vw"
                      unoptimized={!cat.image.includes("res.cloudinary.com")}
                    />
                  ) : (
                    <MediaPlaceholder />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className="font-display text-lg text-ink transition-colors duration-700 group-hover:text-gold">
                    {cat.name}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {cta ? (
        <div className="lux-shell mt-12 flex justify-center">
          <Link href={cta.href} className="lux-btn-outline" style={st.link}>
            {cta.label}
          </Link>
        </div>
      ) : null}
    </SectionShell>
  );
}
