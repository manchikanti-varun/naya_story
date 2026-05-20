import type { CSSProperties } from "react";
import type { SectionDesign, SectionTextColors } from "@/types/homepage";
import { sanitizeHexColor } from "@/lib/storefront-theme";

function hex(v?: string): string | undefined {
  if (!v?.trim()) return undefined;
  const t = v.trim();
  if (t.startsWith("rgba") || t.startsWith("rgb")) return t;
  return sanitizeHexColor(t) ?? undefined;
}

/** Maps CMS section design tokens to inline styles (layout unchanged). */
export function sectionDesignStyle(d?: SectionDesign | null): CSSProperties {
  if (!d) return {};
  const bg = hex(d.backgroundColor);
  const text = hex(d.textColor);
  const style: CSSProperties = {};
  if (bg) style.backgroundColor = bg;
  if (text) style.color = text;
  if (d.paddingTop) style.paddingTop = d.paddingTop;
  if (d.paddingBottom) style.paddingBottom = d.paddingBottom;
  if (d.maxWidth) style.maxWidth = d.maxWidth;
  if (d.align) style.textAlign = d.align;
  if (typeof d.opacity === "number" && d.opacity >= 0 && d.opacity <= 1) {
    style.opacity = d.opacity;
  }
  return style;
}

export function sectionDesignClass(d?: SectionDesign | null): string {
  if (!d?.mode) return "";
  return d.mode === "dark" ? "text-ivory" : "";
}

export function mergeSectionDesign(
  base?: SectionDesign | null,
  override?: SectionDesign | null,
): SectionDesign | undefined {
  if (!base && !override) return undefined;
  return { ...base, ...override };
}

export function mergeSectionTextColors(
  base?: SectionTextColors | null,
  override?: SectionTextColors | null,
): SectionTextColors | undefined {
  if (!base && !override) return undefined;
  const merged = { ...base, ...override };
  const keys = Object.keys(merged).filter((k) => merged[k as keyof SectionTextColors]);
  return keys.length ? merged : undefined;
}

function fontFamily(font?: SectionDesign["headingFont"]): string | undefined {
  if (font === "sans") return "var(--font-sans), sans-serif";
  if (font === "display") return "var(--font-display), serif";
  return undefined;
}

export function heroKickerStyle(d?: SectionDesign | null, text?: CSSProperties): CSSProperties {
  return {
    ...text,
    ...(d?.kickerFontSize ? { fontSize: d.kickerFontSize } : {}),
    ...(d?.letterSpacing ? { letterSpacing: d.letterSpacing } : {}),
    ...(d?.fontWeight ? { fontWeight: d.fontWeight } : {}),
  };
}

export function heroHeadingStyle(d?: SectionDesign | null, text?: CSSProperties): CSSProperties {
  return {
    ...text,
    fontFamily: fontFamily(d?.headingFont),
    ...(d?.headingFontSize ? { fontSize: d.headingFontSize } : {}),
    ...(d?.lineHeight ? { lineHeight: d.lineHeight } : {}),
    ...(d?.letterSpacing ? { letterSpacing: d.letterSpacing } : {}),
    ...(d?.fontWeight ? { fontWeight: d.fontWeight } : {}),
  };
}

export function heroSubheadingStyle(d?: SectionDesign | null, text?: CSSProperties): CSSProperties {
  return {
    ...text,
    ...(d?.subheadingFontSize ? { fontSize: d.subheadingFontSize } : {}),
    ...(d?.lineHeight ? { lineHeight: d.lineHeight } : {}),
    ...(d?.fontWeight ? { fontWeight: d.fontWeight } : {}),
  };
}

export function heroCtaStyle(d?: SectionDesign | null, text?: CSSProperties): CSSProperties {
  const btn = hex(d?.buttonColor);
  const btnText = hex(d?.buttonTextColor);
  return {
    ...text,
    ...(d?.ctaFontSize ? { fontSize: d.ctaFontSize } : {}),
    ...(d?.letterSpacing ? { letterSpacing: d.letterSpacing } : {}),
    ...(btn ? { borderColor: btn } : {}),
    ...(btnText ? { color: btnText } : btn ? { color: btn } : {}),
  };
}

/** When set, replaces default gradient overlays on hero imagery. */
export function heroOverlayStyle(d?: SectionDesign | null): CSSProperties | undefined {
  const color = d?.overlayColor?.trim();
  if (!color) return undefined;
  const opacity =
    typeof d?.overlayOpacity === "number" && d.overlayOpacity >= 0 && d.overlayOpacity <= 1
      ? d.overlayOpacity
      : 0.45;
  const parsed = hex(color);
  if (parsed) {
    return { backgroundColor: parsed, opacity };
  }
  if (color.startsWith("rgba") || color.startsWith("rgb")) {
    return { background: color };
  }
  return undefined;
}
