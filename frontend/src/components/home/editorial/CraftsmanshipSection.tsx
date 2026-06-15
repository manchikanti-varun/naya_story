"use client";

import Image from "next/image";
import Link from "next/link";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { Reveal } from "@/components/luxury/Reveal";
import { SectionShell } from "@/components/cms/SectionShell";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import { sectionTextStyles } from "@/lib/section-text-styles";
import type { HomepageEditorialConfig, SectionTextColors } from "@/types/homepage";

type Props = {
  config?: HomepageEditorialConfig["craftsmanship"];
  sectionText?: SectionTextColors | null;
};

export function CraftsmanshipSection({ config, sectionText }: Props) {
  const c = config ?? defaultHomepageEditorial().craftsmanship;
  if (c.enabled === false) return null;
  const text = sectionTextStyles(sectionText);
  const align = c.styles?.align ?? "left";
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <SectionShell design={c.styles} className="relative overflow-hidden bg-ink text-ivory">
      <div className="lux-shell grid gap-10 py-section-sm sm:gap-12 sm:py-section lg:grid-cols-12 lg:items-center lg:gap-16">
        <Reveal className="lg:col-span-5" as="section">
          <div className={alignClass}>
            <p className="lux-kicker-on-dark" style={text.kicker}>
              {c.kicker}
            </p>
            <h2 className="lux-heading-rail-on-dark mt-4" style={text.heading}>
              {c.title}
            </h2>
            <p className={`lux-copy-on-dark mt-6 max-w-md ${align === "center" ? "mx-auto" : ""}`} style={text.body}>
              {c.body}
            </p>
            <Link
              href={c.ctaHref}
              className={`mt-10 inline-flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.28em] text-ivory/90 transition-colors duration-700 hover:text-gold`}
              style={text.link}
            >
              {c.ctaLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
        <Reveal className="relative lg:col-span-7" delay={0.12} as="section">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lux sm:aspect-[16/10] md:aspect-[21/9]">
            {c.image?.trim() ? (
              <Image
                src={c.image}
                alt={c.imageAlt}
                fill
                className="object-cover lux-image-zoom"
                sizes="(max-width:1024px) 100vw, 60vw"
              />
            ) : (
              <MediaPlaceholder className="bg-ink-soft" label="Craft image" />
            )}
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}
