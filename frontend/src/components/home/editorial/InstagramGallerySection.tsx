"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/components/luxury/Reveal";
import { SectionShell } from "@/components/cms/SectionShell";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import { sectionTextStyles } from "@/lib/section-text-styles";
import type { HomepageEditorialConfig, SectionTextColors } from "@/types/homepage";

type Props = {
  config?: HomepageEditorialConfig["instagramGallery"];
  sectionText?: SectionTextColors | null;
};

function cnTile(i: number) {
  if (i === 0) return "md:col-span-2 md:row-span-2";
  return "";
}

export function InstagramGallerySection({ config, sectionText }: Props) {
  const c = config ?? defaultHomepageEditorial().instagramGallery;
  if (c.enabled === false) return null;
  const text = sectionTextStyles(sectionText);

  return (
    <SectionShell design={c.styles} className="overflow-hidden bg-ivory-muted/60 py-section-sm sm:py-section">
      <div className="lux-shell">
        <Reveal className="text-center">
          <p className="lux-kicker text-gold/90" style={text.kicker}>
            {c.kicker}
          </p>
          <h2
            className="lux-heading-rail mt-2"
            style={text.heading}
          >
            {c.title}
          </h2>
        </Reveal>
        <motion.div
          className="mt-8 grid grid-cols-2 gap-1.5 sm:mt-12 sm:gap-2 md:grid-cols-3 md:gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {c.images.map((src, i) => (
            <motion.div
              key={`${src}-${i}`}
              variants={{
                hidden: { opacity: 0, scale: 0.98 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className={cnTile(i)}
            >
              <Link
                href={c.linkHref}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-square overflow-hidden"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover transition duration-[1.2s] group-hover:scale-[1.06]"
                  sizes="(max-width:768px) 50vw, 20vw"
                />
                <motion.div className="absolute inset-0 bg-ink/0 transition duration-700 group-hover:bg-ink/15" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionShell>
  );
}
