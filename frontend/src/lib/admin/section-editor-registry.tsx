"use client";

import type { ComponentType } from "react";
import type { HomepageLayoutBlockType } from "@/types/homepage";
import {
  ContentEditorBestsellersPanel,
  ContentEditorCategoriesPanel,
  ContentEditorHeroPanel,
  ContentEditorNewInHomePanel,
  ContentEditorNewsletterPanel,
} from "@/components/admin/homepage-editor/panels";
import { ContentEditorEditorialPanel } from "@/components/admin/website/ContentEditorEditorialPanel";
import { ContentEditorTopPromoPanel } from "@/components/admin/homepage-editor/TopPromoPanel";
import { ContentEditorFooterPanel } from "@/components/admin/homepage-editor/panels";

const EDITORIAL_TYPES = new Set<HomepageLayoutBlockType>([
  "brandStory",
  "lookbook",
  "craftsmanship",
  "asSeenIn",
  "editorialJournal",
  "luxuryPromise",
  "instagramGallery",
]);

export function getHomepageSectionEditor(
  type: HomepageLayoutBlockType,
): ComponentType | null {
  if (EDITORIAL_TYPES.has(type)) return ContentEditorEditorialPanel;
  switch (type) {
    case "hero":
      return ContentEditorHeroPanel;
    case "bestsellers":
      return ContentEditorBestsellersPanel;
    case "newIn":
      return ContentEditorNewInHomePanel;
    case "categories":
      return ContentEditorCategoriesPanel;
    case "newsletter":
      return ContentEditorNewsletterPanel;
    case "promoBar":
      return ContentEditorTopPromoPanel;
    case "footer":
      return ContentEditorFooterPanel;
    default:
      return null;
  }
}

export function isEditableHomepageBlock(type: HomepageLayoutBlockType): boolean {
  return type !== "theme" && getHomepageSectionEditor(type) !== null;
}

const EDITORIAL_BLOCK_TYPES = new Set<HomepageLayoutBlockType>([
  "brandStory",
  "lookbook",
  "craftsmanship",
  "asSeenIn",
  "editorialJournal",
  "luxuryPromise",
  "instagramGallery",
]);

export function renderHomepageSectionEditor(type: HomepageLayoutBlockType) {
  const Editor = getHomepageSectionEditor(type);
  if (!Editor) return null;
  if (EDITORIAL_BLOCK_TYPES.has(type)) {
    return <ContentEditorEditorialPanel focusType={type as import("@/types/homepage").HomepageStorefrontBlockType} />;
  }
  return <Editor />;
}
