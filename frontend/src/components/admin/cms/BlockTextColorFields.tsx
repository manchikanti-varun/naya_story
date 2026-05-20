"use client";

import type { SectionTextColors } from "@/types/homepage";
import { sanitizeHexColor } from "@/lib/storefront-theme";
import { CmsColorField } from "@/components/admin/cms/CmsColorField";

const LABELS: Record<keyof SectionTextColors, string> = {
  kicker: "Eyebrow / kicker",
  heading: "Title",
  subheading: "Subtitle",
  body: "Body / message",
  link: "Link & CTA text",
};

type FieldKey = keyof SectionTextColors;

export function BlockTextColorFields({
  fields,
  value,
  onChange,
  intro = "Optional hex colors. Cleared fields inherit carousel or theme defaults.",
}: {
  fields: FieldKey[];
  value?: SectionTextColors | null;
  onChange: (next: SectionTextColors | undefined) => void;
  intro?: string;
}) {
  const cur = value ?? {};

  const patch = (key: FieldKey, hex: string) => {
    const nextBlock: SectionTextColors = { ...cur };
    const trimmed = hex.trim();
    if (!trimmed) delete nextBlock[key];
    else {
      const v = sanitizeHexColor(trimmed);
      if (v) nextBlock[key] = v;
    }
    const keys = Object.keys(nextBlock) as FieldKey[];
    const cleaned = keys.length
      ? (Object.fromEntries(keys.filter((k) => nextBlock[k]).map((k) => [k, nextBlock[k]])) as SectionTextColors)
      : undefined;
    onChange(cleaned);
  };

  return (
    <div className="admin-cms-group">
      <div className="admin-cms-group-header">
        <div>
          <h4 className="admin-cms-kicker">Text colors</h4>
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
