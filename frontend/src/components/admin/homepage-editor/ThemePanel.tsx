"use client";

import { useEffect, useState } from "react";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { sanitizeHexColor } from "@/lib/storefront-theme";
import type { HomepageConfig, StorefrontTheme } from "@/types/homepage";

const DEFAULT_PICKER = "#2c2825";

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  const pickerValue = sanitizeHexColor(value) ?? DEFAULT_PICKER;

  const commitDraft = () => {
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
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)]/60 p-4 sm:p-5">
      <div className="block">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
          {label}
        </span>
        <span className="mt-1 block font-mono text-[11px] font-normal normal-case tracking-normal text-[var(--admin-muted)]">
          {hint}
        </span>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="color"
            aria-label={`${label} picker`}
            className="h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] p-1 shadow-sm"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
          />
          <input
            type="text"
            placeholder="#2C2825 or clear for default"
            className="min-w-[10rem] flex-1 rounded-xl border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2.5 font-mono text-sm text-[var(--admin-ink)] shadow-sm outline-none ring-0 transition focus:border-[var(--admin-accent)]/50 focus:ring-2 focus:ring-[var(--admin-accent-ring)]"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <button
            type="button"
            className="shrink-0 rounded-full border border-[var(--admin-border)] px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface)] hover:text-[var(--admin-ink)]"
            onClick={() => {
              setDraft("");
              onChange("");
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function patchTheme(hp: HomepageConfig, patch: Partial<StorefrontTheme>): HomepageConfig {
  return { ...hp, theme: { ...(hp.theme ?? {}), ...patch } };
}

export function ContentEditorThemePanel() {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;
  const t = hp.theme ?? {};

  const setField = (key: keyof StorefrontTheme, raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setHp((prev) => {
        if (!prev) return prev;
        const next = { ...(prev.theme ?? {}) };
        delete next[key];
        return { ...prev, theme: Object.keys(next).length ? next : {} };
      });
      return;
    }
    const hex = sanitizeHexColor(trimmed);
    if (!hex) return;
    setHp((prev) => (prev ? patchTheme(prev, { [key]: hex }) : prev));
  };

  return (
    <section className="admin-surface-elevated overflow-hidden rounded-2xl p-6 sm:p-8 lg:p-10">
      <div className="border-b border-[var(--admin-border)] pb-6">
        <h2 className="font-sans text-xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-2xl">
          Storefront text colors
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Optional hex colors for the public site. They map to design tokens (
          <span className="rounded bg-[var(--admin-surface-raised)] px-1 font-mono text-[11px] text-[var(--admin-ink)]">
            text-ink
          </span>
          ,{" "}
          <span className="rounded bg-[var(--admin-surface-raised)] px-1 font-mono text-[11px] text-[var(--admin-ink)]">
            text-gold
          </span>
          , etc.). Clear a field to fall back to the built-in palette, then save.
        </p>
      </div>
      <div className="mt-8 grid max-w-xl gap-4">
        <ColorField
          label="Primary text (headings, emphasis)"
          hint="Tailwind: text-ink"
          value={t.textInk ?? ""}
          onChange={(v) => setField("textInk", v)}
        />
        <ColorField
          label="Muted body text"
          hint="Tailwind: text-ink-muted"
          value={t.textInkMuted ?? ""}
          onChange={(v) => setField("textInkMuted", v)}
        />
        <ColorField
          label="Soft / secondary labels"
          hint="Tailwind: text-ink-soft"
          value={t.textInkSoft ?? ""}
          onChange={(v) => setField("textInkSoft", v)}
        />
        <ColorField
          label="Accent (links, kicker lines)"
          hint="Tailwind: text-gold"
          value={t.accentGold ?? ""}
          onChange={(v) => setField("accentGold", v)}
        />
        <ColorField
          label="Default body color"
          hint="CSS variable --foreground (inherits where components use it)"
          value={t.foreground ?? ""}
          onChange={(v) => setField("foreground", v)}
        />
      </div>
    </section>
  );
}
