"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import type { SectionDesign, SectionTextColors } from "@/types/homepage";
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
  tone = "ivory",
  compactTop = false,
  compactBottom = false,
  sectionText,
  design,
}: Props) {
  const st = sectionTextStyles(sectionText);
  return (
    <SectionShell
      design={design}
      className={cn(
        compactTop
          ? compactBottom
            ? "pt-10 pb-10 md:pt-14 md:pb-14"
            : "pb-section pt-10 md:pt-14"
          : compactBottom
            ? "pt-section pb-10 md:pb-14"
            : "py-section",
        !design?.backgroundColor && (tone === "mist" ? "bg-ivory-muted/80" : "bg-ivory"),
      )}
    >
      <div className="lux-shell">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-xl">
            <p className="lux-kicker text-gold/90" style={st.kicker}>
              Curated
            </p>
            <h2
              className="lux-heading-rail mt-2"
              style={st.heading}
            >
              {title}
            </h2>
            <p className="lux-copy mt-4 max-w-md" style={st.subheading}>
              {subtitle}
            </p>
          </div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
          className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:mt-16 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14"
        >
          {products.map((p) => (
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
          <div className="mt-12 flex justify-center">
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
