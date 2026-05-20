"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/luxury/Reveal";
import { SectionShell } from "@/components/cms/SectionShell";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import { sectionTextStyles } from "@/lib/section-text-styles";
import type { HomepageEditorialConfig, SectionTextColors } from "@/types/homepage";

type Props = {
  config?: HomepageEditorialConfig["editorialJournal"];
  sectionText?: SectionTextColors | null;
};

export function EditorialJournalSection({ config, sectionText }: Props) {
  const c = config ?? defaultHomepageEditorial().editorialJournal;
  if (c.enabled === false) return null;
  const text = sectionTextStyles(sectionText);

  return (
    <SectionShell design={c.styles} className="bg-ivory py-section-sm sm:py-section">
      <div className="lux-shell">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="lux-kicker text-gold/90" style={text.kicker}>
              {c.kicker}
            </p>
            <h2
              className="lux-heading-rail mt-2"
              style={text.heading}
            >
              {c.title}
            </h2>
          </div>
          <Link
            href={c.linkHref}
            className="font-sans text-[11px] uppercase tracking-[0.28em] text-ink-muted transition-colors duration-700 hover:text-gold"
            style={text.link}
          >
            {c.linkLabel}
          </Link>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-10 sm:mt-14 sm:grid-cols-2 sm:gap-8 md:grid-cols-3 md:gap-6">
          {c.stories.map((story, i) => (
            <Reveal key={story.title} delay={i * 0.07}>
              <Link href={story.href} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-ivory-soft">
                  <Image
                    src={story.image}
                    alt=""
                    fill
                    className="object-cover transition duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                </div>
                <h3 className="mt-6 font-display text-2xl text-ink transition-colors duration-500 group-hover:text-gold">
                  {story.title}
                </h3>
                <p className="mt-2 font-sans text-sm font-light text-ink-muted">{story.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
