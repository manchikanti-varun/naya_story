import type {
  HomepageConfig,
  HomepageLayoutBlock,
  HomepageLayoutBlockType,
  SectionOrderEntry,
} from "@/types/homepage";

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
  bestsellers: {
    title: "Bestsellers grid",
    description: "Title, subtitle, and curated product IDs for the homepage rail.",
    editHref: "/admin/content/bestsellers",
  },
  newIn: {
    title: "New In rail",
    description: "Homepage new arrivals strip — copy, CTA, and product picks.",
    editHref: "/admin/content/new-in-home",
  },
  categories: {
    title: "Category cards",
    description: "Three-up category tiles with imagery and destinations.",
    editHref: "/admin/content/categories",
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

function sortSections(order: SectionOrderEntry[]) {
  return [...order].sort((a, b) => a.order - b.order);
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
    {
      id: "hero-carousel",
      type: "hero",
      enabled: hp.carousel.slides.some((s) => s.enabled),
      order: -10,
    },
  ];

  for (const s of sortSections(hp.sectionsOrder)) {
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
  const raw =
    hp.layoutBlocks && hp.layoutBlocks.length > 0 ? hp.layoutBlocks : buildLayoutBlocksFromHomepage(hp);
  return enrichBlocks([...raw].sort((a, b) => a.order - b.order));
}

export function withRefreshedLayoutBlocks(hp: HomepageConfig): HomepageConfig {
  return { ...hp, layoutBlocks: buildLayoutBlocksFromHomepage(hp) };
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

/** Apply a block patch to homepage state (client-side mirror of server merge). */
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
  return withRefreshedLayoutBlocks(next);
}
