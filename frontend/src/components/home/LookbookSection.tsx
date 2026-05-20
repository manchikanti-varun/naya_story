"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SectionShell } from "@/components/cms/SectionShell";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import { sectionTextStyles } from "@/lib/section-text-styles";
import type { HomepageEditorialConfig, SectionTextColors } from "@/types/homepage";

type Props = {
  config?: HomepageEditorialConfig["lookbook"];
  sectionText?: SectionTextColors | null;
};

export function LookbookSection({ config, sectionText }: Props) {
  const c = config ?? defaultHomepageEditorial().lookbook;
  if (c.enabled === false) return null;
  const text = sectionTextStyles(sectionText);

  return (
    <SectionShell id="lookbook" design={c.styles} className="bg-ivory py-section-sm sm:py-section">
      <div className="lux-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="lux-kicker text-gold/90" style={text.kicker}>
            {c.kicker}
          </p>
          <h2
            className="lux-heading-rail mt-2"
            style={text.heading}
          >
            {c.title}
          </h2>
          <p
            className="mt-4 font-sans text-sm leading-relaxed text-ink-muted md:text-base"
            style={text.subheading}
          >
            {c.subtitle}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:gap-5 md:grid-cols-12">
          {c.shots.map((s, i) => (
            <motion.figure
              key={`${s.src}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.85, delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-lux-lg bg-ivory-soft sm:rounded-[28px] ${s.span}`}
            >
              <div
                className={`relative min-h-[220px] w-full sm:min-h-[260px] ${s.aspect} md:min-h-0 md:h-full`}
              >
                <Image
                  src={s.src}
                  alt=""
                  fill
                  className="object-cover transition duration-[1.4s] ease-out group-hover:scale-[1.04]"
                  sizes="(max-width:768px) 100vw, 80vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent opacity-0 transition duration-700 group-hover:opacity-100" />
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

