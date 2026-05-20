"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryCard, SectionDesign, SectionTextColors } from "@/types/homepage";
import { SectionShell } from "@/components/cms/SectionShell";
import { sectionTextStyles } from "@/lib/section-text-styles";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  subtitle: string;
  items: CategoryCard[];
  cta?: { label: string; href: string };
  compactTop?: boolean;
  sectionText?: SectionTextColors | null;
  design?: SectionDesign | null;
};

export function ShopByCategorySection({
  title,
  subtitle,
  items,
  cta,
  compactTop = false,
  sectionText,
  design,
}: Props) {
  const visible = [...items]
    .filter((c) => c.enabled)
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  const st = sectionTextStyles(sectionText);

  return (
    <SectionShell
      design={design}
      className={cn(
        !design?.backgroundColor && "bg-ivory-muted/60",
        compactTop ? "pt-10 pb-section md:pt-14" : "py-section",
      )}
    >
      <div className="lux-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="lux-kicker text-gold/90" style={st.kicker}>
            Explore
          </p>
          <h2 className="lux-heading-rail mt-2" style={st.heading}>
            {title}
          </h2>
          <p className="lux-copy mt-4" style={st.subheading}>
            {subtitle}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3 md:gap-8">
          {visible.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.95, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={cat.href || "/collections"} className="group lux-category-tile">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    loading="lazy"
                    className="object-cover object-center lux-image-zoom group-hover:scale-[1.07]"
                    sizes="(max-width:768px) 50vw, 33vw"
                    unoptimized={
                      !cat.image.includes("images.unsplash.com") &&
                      !cat.image.includes("res.cloudinary.com")
                    }
                  />
                ) : null}
                <div className="lux-category-overlay" aria-hidden />
                <div className="absolute inset-0 flex items-end justify-start p-7 pb-9 md:p-9 md:pb-11">
                  <span className="lux-category-label">{cat.name}</span>
                </div>
              </Link>
            </motion.div>
          ))}
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
