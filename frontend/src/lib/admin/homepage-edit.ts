import type { HomepageLayoutBlockType } from "@/types/homepage";
import { isEditableHomepageBlock } from "@/lib/admin/section-editor-registry";
import { websitePagesUrl } from "@/lib/admin/website-pages";

/** Legacy preview slugs and paths → homepage block `edit` param. */
const EDIT_ALIASES: Record<string, HomepageLayoutBlockType> = {
  "new-in-home": "newIn",
  "new-in": "newIn",
  newin: "newIn",
  "promo-bar": "promoBar",
  "home-layout": "hero",
};

export function resolveHomepageEditSection(
  raw: string | null | undefined,
): HomepageLayoutBlockType | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const alias = EDIT_ALIASES[trimmed] ?? EDIT_ALIASES[trimmed.toLowerCase()];
  if (alias && isEditableHomepageBlock(alias)) return alias;

  if (isEditableHomepageBlock(trimmed as HomepageLayoutBlockType)) {
    return trimmed as HomepageLayoutBlockType;
  }

  return null;
}

export function homepageSectionEditUrl(type: HomepageLayoutBlockType): string {
  return websitePagesUrl("homepage", { edit: type });
}
