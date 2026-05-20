import type { HomepageConfig, HomepageLayoutBlock, HomepageStorefrontBlockType } from "@/types/homepage";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import {
  HOMEPAGE_STOREFRONT_BLOCK_ORDER,
  getOrderedStorefrontBlocks,
} from "@/lib/homepage-layout-blocks";

const STOREFRONT_BLOCK_ORDER = HOMEPAGE_STOREFRONT_BLOCK_ORDER;

function isStorefrontBlock(t: string): t is HomepageStorefrontBlockType {
  return STOREFRONT_BLOCK_ORDER.includes(t as HomepageStorefrontBlockType);
}

function blockEnabled(hp: HomepageConfig, type: HomepageStorefrontBlockType): boolean {
  const ed = hp.editorial ?? defaultHomepageEditorial();
  switch (type) {
    case "hero":
      return hp.carousel.slides.some((s) => s.enabled);
    case "brandStory":
      return ed.brandStory.enabled !== false;
    case "bestsellers":
      return (
        hp.sectionsOrder.find((s) => s.id === "bestsellers")?.enabled !== false &&
        hp.bestsellers.enabled !== false
      );
    case "lookbook":
      return ed.lookbook.enabled !== false;
    case "newIn":
      return (
        hp.sectionsOrder.find((s) => s.id === "newIn")?.enabled !== false &&
        hp.newIn.enabled !== false
      );
    case "craftsmanship":
      return ed.craftsmanship.enabled !== false;
    case "categories":
      return (
        hp.sectionsOrder.find((s) => s.id === "categories")?.enabled !== false &&
        hp.categories.enabled !== false
      );
    case "asSeenIn":
      return ed.asSeenIn.enabled !== false;
    case "editorialJournal":
      return ed.editorialJournal.enabled !== false;
    case "luxuryPromise":
      return ed.luxuryPromise.enabled !== false;
    case "instagramGallery":
      return ed.instagramGallery.enabled !== false;
    case "newsletter":
      return (
        hp.sectionsOrder.find((s) => s.id === "newsletter")?.enabled !== false &&
        hp.newsletter.enabled !== false
      );
    default:
      return true;
  }
}

/** Canonical homepage render order for the storefront (uses admin `layoutBlocks` when saved). */
export function buildStorefrontRenderBlocks(hp: HomepageConfig): HomepageLayoutBlock[] {
  const ordered = getOrderedStorefrontBlocks(hp);
  if (ordered.length >= STOREFRONT_BLOCK_ORDER.length) {
    return ordered.map((b) => ({
      ...b,
      enabled: blockEnabled(hp, b.type as HomepageStorefrontBlockType),
    }));
  }

  return STOREFRONT_BLOCK_ORDER.map((type, order) => ({
    id: `block-${type}`,
    type,
    enabled: blockEnabled(hp, type),
    order: order * 10,
  }));
}

export function resolveHomepageEditorial(hp: HomepageConfig) {
  return hp.editorial ?? defaultHomepageEditorial();
}
