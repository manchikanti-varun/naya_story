"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import type { SectionDesign, SectionTextColors } from "@/types/homepage";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { SectionShell } from "@/components/cms/SectionShell";
import { ProductCard } from "@/components/shop/ProductCard";
import { sectionTextStyles } from "@/lib/section-text-styles";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  subtitle: string;
  products: Product[];
  badge?: "bestseller" | "new" | "latest";
  cta?: { label: string; href: string };
  /** Cap grid size on homepage; CTA shows when more products are available. */
  maxVisible?: number;
  /** Small line above title from CMS; hidden when empty. */
  kicker?: string;
  /** Alternating section warmth */
  tone?: "ivory" | "mist";
  compactTop?: boolean;
  compactBottom?: boolean;
  sectionText?: SectionTextColors | null;
  design?: SectionDesign | null;
};

export function HomeProductRail({
  title,
  subtitle,
  products,
  badge,
  cta,
  maxVisible,
  kicker,
  tone = "ivory",
  compactTop = false,
  compactBottom = false,
  sectionText,
  design,
}: Props) {
  if (products.length === 0) return null;

  const cap =
    typeof maxVisible === "number" && maxVisible > 0
      ? Math.min(maxVisible, products.length)
      : products.length;
  const visible = products.slice(0, cap);
  const hasMore = products.length > cap;

  const st = sectionTextStyles(sectionText);
  const headerAlign = design?.align ?? "left";

  return (
    <SectionShell
      design={design ? { ...design, align: undefined } : undefined}
      className={cn(
        compactTop
          ? compactBottom
            ? "pt-6 pb-6 md:pt-8 md:pb-8"
            : "pb-section pt-6 md:pt-8"
          : compactBottom
            ? "pt-section pb-6 md:pb-8"
            : "py-section",
        !design?.backgroundColor && (tone === "mist" ? "bg-ivory-muted/80" : "bg-ivory"),
      )}
    >
      <div
        className={cn(
          "lux-shell",
          headerAlign === "center" ? "text-center" : headerAlign === "right" ? "text-right" : "text-left",
        )}
      >
        <HomeSectionHeader
          kicker={kicker}
          title={title}
          subtitle={subtitle}
          align={headerAlign}
          design={design}
          sectionText={sectionText}
          className="mb-10 sm:mb-14 md:mb-16"
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
          className="grid grid-cols-2 gap-x-3 gap-y-10 text-left sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14"
        >
          {visible.map((p) => (
            <motion.div
              key={p._id}
              variants={{
                hidden: { opacity: 0, y: 28 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              <ProductCard product={p} badge={badge} />
            </motion.div>
          ))}
        </motion.div>

        {cta ? (
          <div className="mt-12 flex flex-col items-center gap-2">
            {products.length > 0 ? (
              <p className="font-sans text-xs text-ink-muted">
                Showing {cap} of {products.length}
              </p>
            ) : null}
            <Link
              href={cta.href}
              className="rounded-full border border-ivory-deep/70 bg-transparent px-8 py-3 font-sans text-[11px] font-light uppercase tracking-[0.28em] text-ink transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold hover:text-gold"
              style={st.link}
            >
              {cta.label}
            </Link>
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
