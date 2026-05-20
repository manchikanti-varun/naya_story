"use client";

import { useEffect, useState } from "react";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { sanitizeHexColor } from "@/lib/storefront-theme";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

/** Accessible color swatch + hex input — shared across CMS typography panels. */
export function CmsColorField({ label, value, onChange }: Props) {
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
    <div className="admin-cms-color-field">
      <span className="admin-cms-field-label">{label}</span>
      <div className="mt-2 flex items-center gap-2.5">
        <label className="admin-cms-swatch-wrap" title={`Pick ${label} color`}>
          <span className="admin-cms-swatch" style={{ backgroundColor: safe }} aria-hidden />
          <input
            type="color"
            className="admin-cms-swatch-input"
            aria-label={`${label} color`}
            value={safe}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <AdminInput
          placeholder="#2C2825"
          className="min-w-0 flex-1 font-mono text-xs"
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
        <AdminButton
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 px-2.5"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
        >
          Clear
        </AdminButton>
      </div>
    </div>
  );
}
