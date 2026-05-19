"use client";

import { useEffect, useState } from "react";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { sanitizeHexColor } from "@/lib/storefront-theme";
import type { HomepageSectionTextKey, HomepageConfig, SectionTextColors } from "@/types/homepage";

export type CmsTextSection = HomepageSectionTextKey;

const LABELS: Record<keyof SectionTextColors, string> = {
  kicker: "Eyebrow / kicker",
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
};

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const safe = sanitizeHexColor(value) ?? "#2c2825";
  const commit = () => {
    const t = draft.trim();
    if (!t) {
      onChange("");
      return;
    }
    const h = sanitizeHexColor(t);
    if (h) onChange(h);
    else setDraft(value);
  };
  return (
    <label className="block font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
      {label}
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color`}
          className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          placeholder="#2C2825 or empty"
          className="min-w-[8rem] flex-1 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs text-slate-800"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button
          type="button"
          className="rounded-full border border-slate-200 px-2 py-1 text-[10px] uppercase text-slate-600 hover:bg-slate-50"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
        >
          Clear
        </button>
      </div>
    </label>
  );
}

export function SectionTypographyFields({
  section,
  intro = "Optional hex colors for this block only. Cleared fields use the global theme.",
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
    <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Section typography</p>
      <p className="mt-2 font-sans text-xs leading-relaxed text-slate-600">{intro}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((fk) => (
          <ColorRow key={fk} label={LABELS[fk]} value={cur[fk] ?? ""} onChange={(v) => patch(fk, v)} />
        ))}
      </div>
    </div>
  );
}
