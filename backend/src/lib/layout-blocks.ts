import type {
  HomepageConfig,
  HomepageLayoutBlock,
  HomepageLayoutBlockType,
  SectionOrderEntry,
} from "../types/homepage.js";
import { defaultHomepageEditorial } from "./editorial-defaults.js";

const SECTION_IDS: SectionOrderEntry["id"][] = ["bestsellers", "newIn", "categories", "newsletter"];

const STOREFRONT_BLOCK_ORDER: HomepageLayoutBlockType[] = [
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

const BLOCK_TYPES = new Set<string>([
  "promoBar",
  "theme",
  ...STOREFRONT_BLOCK_ORDER,
  "footer",
]);

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

export function attachLayoutBlocks(hp: HomepageConfig): HomepageConfig {
  return {
    ...hp,
    layoutBlocks: buildLayoutBlocksFromHomepage(hp),
  };
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

export function mergeLayoutBlocksIntoHomepage(
  hp: HomepageConfig,
  rawLayoutBlocks: unknown,
): HomepageConfig {
  const patch = sanitizeLayoutBlocksPatch(rawLayoutBlocks);
  let next: HomepageConfig = { ...hp };
  if (patch) {
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
    next = { ...next, layoutBlocks: [...patch].sort((a, b) => a.order - b.order) };
    return next;
  }
  return attachLayoutBlocks(next);
}
