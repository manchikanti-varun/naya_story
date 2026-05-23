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

        <div className="lux-shop-categories text-left">
          <div
            className="lux-scroll-x flex gap-4 pb-2 md:gap-6"
            role="list"
            aria-label="Shop by category"
          >
            {visible.map((cat, i) => (
              <motion.div
                key={cat.id}
                role="listitem"
                className="w-[min(72vw,280px)] shrink-0 sm:w-[min(42vw,300px)] md:w-[min(28vw,320px)]"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.95, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link href={cat.href || "/collections"} className="group lux-category-tile">
                  {isNextImageSrc(cat.image) ? (
                    <Image
                      src={cat.image.trim()}
                      alt={cat.name}
                      fill
                      loading="lazy"
                      className="object-cover object-center lux-image-zoom group-hover:scale-[1.07]"
                      sizes="(max-width:768px) 72vw, 320px"
                      unoptimized={!cat.image.includes("res.cloudinary.com")}
                    />
                  ) : (
                    <MediaPlaceholder />
                  )}
                  <div className="lux-category-overlay" aria-hidden />
                  <div className="absolute inset-0 flex items-end justify-start p-7 pb-9 md:p-9 md:pb-11">
                    <span className="lux-category-label">{cat.name}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        {cta ? (
          <div className="mt-12 flex justify-center">
            <Link href={cta.href} className="lux-btn-outline" style={st.link}>
              {cta.label}
            </Link>
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
