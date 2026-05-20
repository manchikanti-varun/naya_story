"use client";

import { Reveal } from "@/components/luxury/Reveal";
import { SectionShell } from "@/components/cms/SectionShell";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import { sectionTextStyles } from "@/lib/section-text-styles";
import type { HomepageEditorialConfig, SectionTextColors } from "@/types/homepage";

type Props = {
  config?: HomepageEditorialConfig["asSeenIn"];
  sectionText?: SectionTextColors | null;
};

export function AsSeenInSection({ config, sectionText }: Props) {
  const c = config ?? defaultHomepageEditorial().asSeenIn;
  if (c.enabled === false) return null;
  const text = sectionTextStyles(sectionText);

  return (
    <SectionShell design={c.styles} className="bg-ivory py-section-sm sm:py-20 md:py-24">
      <div className="lux-shell">
        <Reveal className="text-center">
          <p className="lux-kicker" style={text.kicker}>
            {c.kicker}
          </p>
        </Reveal>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-5 sm:mt-12 sm:gap-x-12 sm:gap-y-6 md:gap-x-16">
          {c.names.map((name, i) => (
            <Reveal key={name} delay={i * 0.05}>
              <li className="font-display text-[clamp(1.25rem,2.5vw,1.75rem)] font-normal tracking-[0.12em] text-ink/35 transition-colors duration-700 hover:text-ink/55">
                {name}
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
