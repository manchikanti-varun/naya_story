import type { StorefrontTheme } from "@/types/homepage";

/** Must match the `<style id>` in the store layout for live theme updates. */
export const NAYA_STORE_THEME_STYLE_ID = "naya-store-theme";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function sanitizeHexColor(input: string): string | null {
  const s = input.trim();
  if (!HEX.test(s)) return null;
  return s;
}

/** CSS for `<style>` — sets `:root` variables consumed by Tailwind theme colors. */
export function storefrontThemeCssString(theme: StorefrontTheme | undefined): string {
  if (!theme || typeof theme !== "object") return "";
  const parts: string[] = [];

  // Only inject validated hex colors — prevents CSS injection from corrupted CMS data
  const tryAdd = (varName: string, raw: string | undefined) => {
    if (!raw) return;
    const safe = sanitizeHexColor(raw);
    if (safe) parts.push(`${varName}:${safe}`);
  };

  tryAdd("--color-ink", theme.textInk);
  tryAdd("--color-ink-muted", theme.textInkMuted);
  tryAdd("--color-ink-soft", theme.textInkSoft);
  tryAdd("--color-gold", theme.accentGold);
  tryAdd("--foreground", theme.foreground);

  if (parts.length === 0) return "";
  return `:root{${parts.join(";")}}`;
}

/** Update or create the live theme `<style>` node (instant color changes without full navigation). */
export function updateDocumentStorefrontThemeCss(css: string): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById(NAYA_STORE_THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = NAYA_STORE_THEME_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css.trim() ? css : "/* naya storefront theme */";
}
