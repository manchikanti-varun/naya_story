"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { SectionShell } from "@/components/cms/SectionShell";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import { sectionTextStyles } from "@/lib/section-text-styles";
import type { HomepageEditorialConfig, SectionTextColors } from "@/types/homepage";

type Props = {
  config?: HomepageEditorialConfig["brandStory"];
  sectionText?: SectionTextColors | null;
};

export function BrandStory({ config, sectionText }: Props) {
  const c = config ?? defaultHomepageEditorial().brandStory;
  if (c.enabled === false) return null;
  const text = sectionTextStyles(sectionText);
  const titleLines = c.title.split("\n");

  return (
    <SectionShell id="story" design={c.styles} className="bg-ivory-soft py-section-sm sm:py-section">
      <div className="lux-shell grid gap-10 sm:gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9 }}
          className="relative order-1 aspect-[4/5] overflow-hidden rounded-lux-lg lg:order-none"
        >
          {c.image?.trim() ? (
            <Image
              src={c.image}
              alt={c.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          ) : (
            <MediaPlaceholder />
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9 }}
          className="order-2 space-y-6 sm:space-y-8 lg:order-none"
        >
          <p className="lux-kicker text-gold/90" style={text.kicker}>
            {c.kicker}
          </p>
          <h2
            className="lux-heading-rail"
            style={text.heading}
          >
            {titleLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < titleLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h2>
          {c.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="lux-copy max-w-xl" style={text.body}>
              {paragraph}
            </p>
          ))}
        </motion.div>
      </div>
    </SectionShell>
  );
}
