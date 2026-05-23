"use client";

import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { CmsColorField } from "@/components/admin/cms/CmsColorField";
import { sanitizeHexColor } from "@/lib/storefront-theme";
import type { HomepageSectionTextKey, HomepageConfig, SectionTextColors } from "@/types/homepage";

export type CmsTextSection = HomepageSectionTextKey;

const LABELS: Record<keyof SectionTextColors, string> = {
  kicker: "Eyebrow color",
  heading: "Title",
  subheading: "Subtitle",
  body: "Body / message",
  link: "Link & CTA text",
};

type FieldKey = keyof SectionTextColors;

const SECTION_FIELDS: Record<CmsTextSection, FieldKey[]> = {
  hero: ["kicker", "heading", "subheading", "link"],
  bestsellers: ["kicker", "heading", "subheading", "link"],
  newIn: ["kicker", "heading", "subheading", "link"],
  categories: ["kicker", "heading", "subheading", "link"],
  newsletter: ["kicker", "heading", "body", "link"],
  promoBar: ["body", "link"],
  brandStory: ["kicker", "heading", "body"],
  lookbook: ["kicker", "heading", "subheading"],
  craftsmanship: ["kicker", "heading", "body", "link"],
  asSeenIn: ["kicker"],
  editorialJournal: ["kicker", "heading", "link"],
  luxuryPromise: ["kicker", "heading", "body"],
  instagramGallery: ["kicker", "heading"],
};

export function SectionTypographyFields({
  section,
  intro = "Optional hex colors for this block. Eyebrow wording is set on the Content tab, not here.",
}: {
  section: CmsTextSection;
  intro?: string;
}) {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;
  const fields = SECTION_FIELDS[section];
  const cur = hp.sectionTextColors?.[section] ?? {};

  const patch = (key: FieldKey, hex: string) => {
    setHp((prev) => {
      if (!prev) return prev;
      const nextBlock: SectionTextColors = { ...prev.sectionTextColors?.[section] };
      const trimmed = hex.trim();
      if (!trimmed) {
        delete nextBlock[key];
      } else {
        const v = sanitizeHexColor(trimmed);
        if (v) nextBlock[key] = v;
      }
      const keys = Object.keys(nextBlock) as FieldKey[];
      const cleaned = keys.length
        ? (Object.fromEntries(keys.filter((k) => nextBlock[k]).map((k) => [k, nextBlock[k]])) as SectionTextColors)
        : undefined;
      const nextSections = {
        ...(prev.sectionTextColors ?? {}),
      } as NonNullable<HomepageConfig["sectionTextColors"]>;
      if (!cleaned || Object.keys(cleaned).length === 0) delete nextSections[section];
      else nextSections[section] = cleaned;
      return {
        ...prev,
        sectionTextColors: Object.keys(nextSections).length > 0 ? nextSections : undefined,
      };
    });
  };

  return (
    <div className="admin-cms-group">
      <div className="admin-cms-group-header">
        <div>
          <h4 className="admin-cms-kicker">Section typography</h4>
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">{intro}</p>
        </div>
      </div>
      <div className="admin-cms-group-body">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((fk) => (
            <CmsColorField
              key={fk}
              label={LABELS[fk]}
              value={cur[fk] ?? ""}
              onChange={(v) => patch(fk, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
