import type { HomepageLayoutBlockType, HomepageStorefrontBlockType } from "@/types/homepage";

export type SectionMeta = {
  label: string;
  description: string;
  editHref?: string;
  previewSlug?: string;
};

export const STOREFRONT_SECTION_META: Record<HomepageStorefrontBlockType, SectionMeta> = {
  hero: {
    label: "Hero carousel",
    description: "Full-width slides with headline, CTA, and imagery.",
    editHref: "/admin/content/hero",
    previewSlug: "hero",
  },
  brandStory: {
    label: "Brand story",
    description: "Editorial intro block with image and narrative copy.",
    editHref: "/admin/content/editorial",
    previewSlug: "editorial",
  },
  bestsellers: {
    label: "Bestsellers rail",
    description: "Curated product carousel — homepage commerce.",
    editHref: "/admin/content/bestsellers",
    previewSlug: "bestsellers",
  },
  lookbook: {
    label: "Lookbook",
    description: "Campaign stills in an editorial grid.",
    editHref: "/admin/content/editorial",
    previewSlug: "editorial",
  },
  newIn: {
    label: "New In rail",
    description: "Latest pieces on the homepage.",
    editHref: "/admin/content/new-in-home",
    previewSlug: "new-in-home",
  },
  craftsmanship: {
    label: "Craftsmanship",
    description: "Fabric and atelier story with CTA.",
    editHref: "/admin/content/editorial",
    previewSlug: "editorial",
  },
  categories: {
    label: "Shop by category",
    description: "Category cards linking into collections.",
    editHref: "/admin/content/categories",
    previewSlug: "categories",
  },
  asSeenIn: {
    label: "As seen in",
    description: "Press and publication names.",
    editHref: "/admin/content/editorial",
    previewSlug: "editorial",
  },
  editorialJournal: {
    label: "Editorial journal",
    description: "Story cards linking to journal content.",
    editHref: "/admin/content/editorial",
    previewSlug: "editorial",
  },
  luxuryPromise: {
    label: "Luxury promise",
    description: "Service and brand value pillars.",
    editHref: "/admin/content/editorial",
    previewSlug: "editorial",
  },
  instagramGallery: {
    label: "Instagram gallery",
    description: "Social imagery grid with outbound link.",
    editHref: "/admin/content/editorial",
    previewSlug: "editorial",
  },
  newsletter: {
    label: "Newsletter",
    description: "Email capture and secondary CTA.",
    editHref: "/admin/content/newsletter",
    previewSlug: "newsletter",
  },
};

export function getSectionMeta(type: HomepageLayoutBlockType): SectionMeta {
  if (type in STOREFRONT_SECTION_META) {
    return STOREFRONT_SECTION_META[type as HomepageStorefrontBlockType];
  }
  const fallback: Record<string, SectionMeta> = {
    promoBar: { label: "Announcement bar", description: "Top site-wide strip.", editHref: "/admin/content/promo-bar" },
    theme: { label: "Theme", description: "Global brand colors.", editHref: "/admin/content/theme" },
    footer: { label: "Footer", description: "Site footer links and logo.", editHref: "/admin/content/footer" },
  };
  return fallback[type] ?? { label: type, description: "" };
}
