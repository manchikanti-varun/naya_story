"use client";

import { Reveal } from "@/components/luxury/Reveal";
import { SectionShell } from "@/components/cms/SectionShell";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import { sectionTextStyles } from "@/lib/section-text-styles";
import type { HomepageEditorialConfig, SectionTextColors } from "@/types/homepage";

type Props = {
  config?: HomepageEditorialConfig["luxuryPromise"];
  sectionText?: SectionTextColors | null;
};

export function LuxuryPromiseSection({ config, sectionText }: Props) {
  const c = config ?? defaultHomepageEditorial().luxuryPromise;
  if (c.enabled === false) return null;
  const text = sectionTextStyles(sectionText);

  return (
    <SectionShell design={c.styles} className="border-y border-sand/60 bg-ivory-soft/50">
      <div className="lux-shell py-section-sm sm:py-section">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="lux-kicker text-gold/90" style={text.kicker}>
            {c.kicker}
          </p>
          <h2
            className="lux-heading-rail mt-3"
            style={text.heading}
          >
            {c.title}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-10 sm:mt-16 sm:gap-12 md:grid-cols-3 md:gap-8">
          {c.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08} className="text-center md:text-left">
              <p className="font-display text-2xl text-ink">{item.title}</p>
              <p className="mt-4 font-sans text-sm font-light leading-[1.75] text-ink-muted">
                {item.copy}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
