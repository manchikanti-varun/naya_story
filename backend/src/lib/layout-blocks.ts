import type { HomepageConfig, HomepageLayoutBlock, SectionOrderEntry } from "../types/homepage.js";

const SECTION_IDS: SectionOrderEntry["id"][] = ["bestsellers", "newIn", "categories", "newsletter"];

const BLOCK_TYPES = new Set<string>([
  "promoBar",
  "theme",
  "hero",
  "bestsellers",
  "newIn",
  "categories",
  "newsletter",
  "footer",
]);

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
    {
      id: "hero-carousel",
      type: "hero",
      enabled: hp.carousel.slides.some((s) => s.enabled),
      order: -10,
    },
  ];

  const sorted = [...hp.sectionsOrder].sort((a, b) => a.order - b.order);
  for (const s of sorted) {
    blocks.push({
      id: `section-${s.id}`,
      type: s.id,
      enabled: s.enabled !== false,
      order: s.order,
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
      type: type as HomepageLayoutBlock["type"],
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
  }
  return attachLayoutBlocks(next);
}
