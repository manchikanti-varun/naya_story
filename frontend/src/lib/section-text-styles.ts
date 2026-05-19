import type { CSSProperties } from "react";
import type { SectionTextColors } from "@/types/homepage";
import { sanitizeHexColor } from "@/lib/storefront-theme";

function c(v?: string): string | undefined {
  if (!v?.trim()) return undefined;
  return sanitizeHexColor(v) ?? undefined;
}

/** Inline styles for storefront section copy (hex from CMS). */
export function sectionTextStyles(t?: SectionTextColors | null): {
  kicker?: CSSProperties;
  heading?: CSSProperties;
  subheading?: CSSProperties;
  body?: CSSProperties;
  link?: CSSProperties;
} {
  if (!t) return {};
  const k = c(t.kicker);
  const h = c(t.heading);
  const s = c(t.subheading);
  const b = c(t.body);
  const l = c(t.link);
  return {
    ...(k ? { kicker: { color: k } } : {}),
    ...(h ? { heading: { color: h } } : {}),
    ...(s ? { subheading: { color: s } } : {}),
    ...(b ? { body: { color: b } } : {}),
    ...(l ? { link: { color: l } } : {}),
  };
}
