import type {
  HomepageConfig,
  HomepageLayoutBlock,
  HomepageLayoutBlockType,
  HomepageStorefrontBlockType,
  SectionOrderEntry,
} from "@/types/homepage";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";

export type HomepageLayoutBlockMeta = {
  id: string;
  type: HomepageLayoutBlockType;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
  editHref: string;
};

const SECTION_IDS: SectionOrderEntry["id"][] = ["bestsellers", "newIn", "categories", "newsletter"];

/** Storefront homepage sections (render order on `/`). */
export const HOMEPAGE_STOREFRONT_BLOCK_ORDER: HomepageStorefrontBlockType[] = [
  "hero",
  "brandStory",
  "bestsellers",
  "lookbook",
  "newIn",
  "craftsmanship",
  "categories",
  "asSeenIn",
  "editorialJournal",
  "luxuryPromise",
  "instagramGallery",
  "newsletter",
];

const STOREFRONT_BLOCK_ORDER: HomepageLayoutBlockType[] = HOMEPAGE_STOREFRONT_BLOCK_ORDER;

export function isHomepageStorefrontBlockType(
  type: string,
): type is HomepageStorefrontBlockType {
  return HOMEPAGE_STOREFRONT_BLOCK_ORDER.includes(type as HomepageStorefrontBlockType);
}

const BLOCK_TYPES = new Set<string>([
  "promoBar",
  "theme",
  ...STOREFRONT_BLOCK_ORDER,
  "footer",
]);

const BLOCK_META: Record<
  HomepageLayoutBlockType,
  { title: string; description: string; editHref: string }
> = {
  promoBar: {
    title: "Top promo bar",
    description: "Thin announcement strip above the main navigation.",
    editHref: "/admin/content/promo-bar",
  },
  theme: {
    title: "Theme & text colors",
    description: "Optional storefront typography tokens (CSS variables).",
    editHref: "/admin/content/theme",
  },
  hero: {
    title: "Hero carousel",
    description: "Full-width slides, imagery, and primary CTAs.",
    editHref: "/admin/content/hero",
  },
  brandStory: {
    title: "Brand story",
    description: "Split editorial block below the hero.",
    editHref: "/admin/content/editorial#brand-story",
  },
  bestsellers: {
    title: "Bestsellers grid",
    description: "Title, subtitle, and curated product IDs for the homepage rail.",
    editHref: "/admin/content/bestsellers",
  },
  lookbook: {
    title: "Lookbook",
    description: "Campaign stills grid before the New In rail.",
    editHref: "/admin/content/editorial#lookbook",
  },
  newIn: {
    title: "New In rail",
    description: "Homepage new arrivals strip — copy, CTA, and product picks.",
    editHref: "/admin/content/new-in-home",
  },
  craftsmanship: {
    title: "Fabric & craft",
    description: "Dark editorial band with atelier CTA.",
    editHref: "/admin/content/editorial#craftsmanship",
  },
  categories: {
    title: "Category cards",
    description: "Three-up category tiles with imagery and destinations.",
    editHref: "/admin/content/categories",
  },
  asSeenIn: {
    title: "As seen in",
    description: "Press / publication name strip.",
    editHref: "/admin/content/editorial#as-seen-in",
  },
  editorialJournal: {
    title: "Editorial journal",
    description: "Three-up story cards with imagery.",
    editHref: "/admin/content/editorial#journal",
  },
  luxuryPromise: {
    title: "Our promise",
    description: "Three-column service promise block.",
    editHref: "/admin/content/editorial#promise",
  },
  instagramGallery: {
    title: "Instagram gallery",
    description: "Social grid — @nayastory.",
    editHref: "/admin/content/editorial#instagram",
  },
  newsletter: {
    title: "Newsletter",
    description: "Signup copy, placeholder, and button label (site-wide block).",
    editHref: "/admin/content/newsletter",
  },
  footer: {
    title: "Footer",
    description: "Brand, legal links, contact, and social (site-wide).",
    editHref: "/admin/content/footer",
  },
};

function blockEnabled(hp: HomepageConfig, type: HomepageLayoutBlockType): boolean {
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

function applyEditorialEnabled(
  hp: HomepageConfig,
  type: HomepageLayoutBlockType,
  enabled: boolean,
): HomepageConfig {
  const ed = { ...(hp.editorial ?? defaultHomepageEditorial()) };
  switch (type) {
    case "brandStory":
      ed.brandStory = { ...ed.brandStory, enabled };
      break;
    case "lookbook":
      ed.lookbook = { ...ed.lookbook, enabled };
      break;
    case "craftsmanship":
      ed.craftsmanship = { ...ed.craftsmanship, enabled };
      break;
    case "asSeenIn":
      ed.asSeenIn = { ...ed.asSeenIn, enabled };
      break;
    case "editorialJournal":
      ed.editorialJournal = { ...ed.editorialJournal, enabled };
      break;
    case "luxuryPromise":
      ed.luxuryPromise = { ...ed.luxuryPromise, enabled };
      break;
    case "instagramGallery":
      ed.instagramGallery = { ...ed.instagramGallery, enabled };
      break;
    default:
      break;
  }
  return { ...hp, editorial: ed };
}

export function buildLayoutBlocksFromHomepage(hp: HomepageConfig): HomepageLayoutBlock[] {
  const blocks: HomepageLayoutBlock[] = [
    {
      id: "global-promo",
      type: "promoBar",
      enabled: hp.topPromoBar.enabled === true,
      order: -20,
    },
    {
      id: "global-theme",
      type: "theme",
      enabled: true,
      order: -15,
    },
  ];

  for (const type of STOREFRONT_BLOCK_ORDER) {
    blocks.push({
      id: `block-${type}`,
      type,
      enabled: blockEnabled(hp, type),
      order: STOREFRONT_BLOCK_ORDER.indexOf(type) * 10,
    });
  }

  blocks.push({
    id: "global-footer",
    type: "footer",
    enabled: true,
    order: 1000,
  });

  return blocks.sort((a, b) => a.order - b.order);
}

function enrichBlocks(blocks: HomepageLayoutBlock[]): HomepageLayoutBlockMeta[] {
  return blocks.map((b) => {
    const meta = BLOCK_META[b.type];
    return {
      id: b.id,
      type: b.type,
      enabled: b.enabled,
      order: b.order,
      title: meta.title,
      description: meta.description,
      editHref: meta.editHref,
    };
  });
}

export function deriveHomepageLayoutBlocks(hp: HomepageConfig): HomepageLayoutBlockMeta[] {
  return enrichBlocks(ensureHomepageLayoutBlocks(hp));
}

/** Full layout list with saved order + current enabled flags. */
export function ensureHomepageLayoutBlocks(hp: HomepageConfig): HomepageLayoutBlock[] {
  const base = buildLayoutBlocksFromHomepage(hp);
  if (!hp.layoutBlocks?.length) return base;

  const savedByType = new Map(hp.layoutBlocks.map((b) => [b.type, b]));
  return base
    .map((b) => {
      const saved = savedByType.get(b.type);
      return {
        ...b,
        id: saved?.id ?? b.id,
        order: saved?.order ?? b.order,
        enabled: blockEnabled(hp, b.type),
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getOrderedStorefrontBlocks(hp: HomepageConfig): HomepageLayoutBlock[] {
  return ensureHomepageLayoutBlocks(hp).filter((b) => isHomepageStorefrontBlockType(b.type));
}

function syncSectionsOrderFromLayoutBlocks(hp: HomepageConfig): HomepageConfig {
  const blocks = getOrderedStorefrontBlocks(hp);
  const picks = SECTION_IDS.map((id) => blocks.find((b) => b.type === id)).filter(
    (b): b is HomepageLayoutBlock => Boolean(b),
  );
  if (picks.length !== SECTION_IDS.length) return hp;

  const byId = Object.fromEntries(hp.sectionsOrder.map((s) => [s.id, s])) as Record<
    SectionOrderEntry["id"],
    SectionOrderEntry
  >;

  return {
    ...hp,
    sectionsOrder: picks.map((b, idx) => ({
      ...byId[b.type as SectionOrderEntry["id"]],
      id: b.type as SectionOrderEntry["id"],
      enabled: b.enabled,
      order: idx,
    })),
  };
}

/** Reorder storefront blocks by drag-drop indices. */
export function reorderHomepageStorefrontBlocks(
  hp: HomepageConfig,
  fromIndex: number,
  toIndex: number,
): HomepageConfig {
  const storefront = getOrderedStorefrontBlocks(hp);
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= storefront.length || toIndex >= storefront.length) {
    return hp;
  }
  if (fromIndex === toIndex) return hp;
  const next = [...storefront];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved!);
  const orderByType = new Map(next.map((b, i) => [b.type, i * 10]));
  const all = ensureHomepageLayoutBlocks(hp);
  const nextBlocks = all
    .map((b) => {
      const o = orderByType.get(b.type);
      return o !== undefined ? { ...b, order: o } : b;
    })
    .sort((a, b) => a.order - b.order);
  return syncSectionsOrderFromLayoutBlocks({ ...hp, layoutBlocks: nextBlocks });
}

/** Move a homepage storefront block up/down; persists in `layoutBlocks`. */
export function moveHomepageStorefrontBlock(
  hp: HomepageConfig,
  type: HomepageStorefrontBlockType,
  dir: -1 | 1,
): HomepageConfig {
  const storefront = getOrderedStorefrontBlocks(hp);
  const index = storefront.findIndex((b) => b.type === type);
  const j = index + dir;
  if (index < 0 || j < 0 || j >= storefront.length) return hp;

  const swapped = [...storefront];
  [swapped[index], swapped[j]] = [swapped[j], swapped[index]];
  const orderByType = new Map(swapped.map((b, i) => [b.type, i * 10]));

  const all = ensureHomepageLayoutBlocks(hp);
  const nextBlocks = all
    .map((b) => {
      const nextOrder = orderByType.get(b.type);
      return nextOrder !== undefined ? { ...b, order: nextOrder } : b;
    })
    .sort((a, b) => a.order - b.order);

  return syncSectionsOrderFromLayoutBlocks({ ...hp, layoutBlocks: nextBlocks });
}

export function withRefreshedLayoutBlocks(hp: HomepageConfig): HomepageConfig {
  return syncSectionsOrderFromLayoutBlocks({
    ...hp,
    layoutBlocks: ensureHomepageLayoutBlocks(hp),
  });
}

export function sanitizeLayoutBlocksPatch(raw: unknown): HomepageLayoutBlock[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: HomepageLayoutBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const type = o.type;
    if (typeof type !== "string" || !BLOCK_TYPES.has(type)) continue;
    const id = typeof o.id === "string" && o.id ? o.id : `block-${type}-${out.length}`;
    const enabled = o.enabled !== false;
    const order = typeof o.order === "number" && Number.isFinite(o.order) ? o.order : out.length;
    out.push({
      id,
      type: type as HomepageLayoutBlockType,
      enabled,
      order,
    });
  }
  return out.length ? out : null;
}

export function mergeLayoutBlocksIntoHomepageClient(
  hp: HomepageConfig,
  patch: HomepageLayoutBlock[] | null,
): HomepageConfig {
  if (!patch) return withRefreshedLayoutBlocks(hp);
  let next: HomepageConfig = { ...hp, layoutBlocks: [...patch] };
  const promo = patch.find((b) => b.type === "promoBar");
  if (promo) {
    next = { ...next, topPromoBar: { ...next.topPromoBar, enabled: promo.enabled } };
  }
  const hero = patch.find((b) => b.type === "hero");
  if (hero) {
    next = {
      ...next,
      carousel: {
        ...next.carousel,
        slides: next.carousel.slides.map((s) => ({ ...s, enabled: hero.enabled })),
      },
    };
  }
  for (const block of patch) {
    if (SECTION_IDS.includes(block.type as SectionOrderEntry["id"])) {
      const id = block.type as SectionOrderEntry["id"];
      next = {
        ...next,
        sectionsOrder: next.sectionsOrder.map((s) =>
          s.id === id ? { ...s, enabled: block.enabled } : s,
        ),
      };
    }
    if (
      [
        "brandStory",
        "lookbook",
        "craftsmanship",
        "asSeenIn",
        "editorialJournal",
        "luxuryPromise",
        "instagramGallery",
      ].includes(block.type)
    ) {
      next = applyEditorialEnabled(next, block.type, block.enabled);
    }
  }
  const picks = SECTION_IDS.map((id) => patch.find((b) => b.type === id)).filter(
    (b): b is HomepageLayoutBlock => Boolean(b),
  );
  if (picks.length === 4) {
    picks.sort((a, b) => a.order - b.order);
    const byId = Object.fromEntries(next.sectionsOrder.map((s) => [s.id, s])) as Record<
      SectionOrderEntry["id"],
      SectionOrderEntry
    >;
    next = {
      ...next,
      sectionsOrder: picks.map((b, idx) => ({
        ...byId[b.type as SectionOrderEntry["id"]],
        id: b.type as SectionOrderEntry["id"],
        enabled: b.enabled,
        order: idx,
      })),
    };
  }
  return syncSectionsOrderFromLayoutBlocks({
    ...next,
    layoutBlocks: [...patch].sort((a, b) => a.order - b.order),
  });
}
