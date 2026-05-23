import type { CategoryCard, GlobalStoreCategory, HomepageConfig } from "@/types/homepage";

export type { GlobalStoreCategory };

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugFromCategoryHref(href: string): string {
  try {
    const q = href.split("?")[1];
    if (!q) return "";
    const params = new URLSearchParams(q);
    return params.get("category")?.trim() ?? "";
  } catch {
    return "";
  }
}

export function hrefFromCategorySlug(slug: string): string {
  const s = slug.trim();
  return s ? `/collections?category=${encodeURIComponent(s)}` : "/collections";
}

export function categoryCardFromGlobal(g: GlobalStoreCategory): CategoryCard {
  return {
    id: g.id,
    name: g.name,
    image: g.image,
    href: g.href?.trim() || hrefFromCategorySlug(g.slug),
    enabled: g.enabled && g.homepage,
    order: g.order,
  };
}

function migrateFromLegacyItems(items: CategoryCard[]): GlobalStoreCategory[] {
  return items.map((c, i) => {
    const slug = slugFromCategoryHref(c.href) || slugifyCategoryName(c.name) || `category-${i + 1}`;
    return {
      id: c.id || `cat-${i + 1}`,
      name: c.name,
      slug,
      image: c.image,
      href: c.href?.trim() || hrefFromCategorySlug(slug),
      enabled: c.enabled !== false,
      order: typeof c.order === "number" ? c.order : i,
      homepage: true,
      collections: true,
    };
  });
}

/** Resolve global list from config (migrates legacy `categories.items` when needed). */
export function getGlobalCategories(hp: HomepageConfig): GlobalStoreCategory[] {
  if (Array.isArray(hp.globalCategories) && hp.globalCategories.length > 0) {
    return [...hp.globalCategories].sort((a, b) => a.order - b.order);
  }
  return migrateFromLegacyItems(hp.categories?.items ?? []);
}

function systemCollectionTabs(hp: HomepageConfig) {
  const existing = hp.collectionsPage?.categories ?? [];
  const all =
    existing.find((t) => t.type === "all") ??
    ({
      id: "all",
      label: "All",
      type: "all" as const,
      enabled: true,
      order: 0,
    });
  const bestselling =
    existing.find((t) => t.type === "bestselling") ??
    ({
      id: "bestselling",
      label: "Bestselling",
      type: "bestselling" as const,
      enabled: true,
      order: 1,
    });
  return [all, bestselling];
}

/** Apply global categories to homepage cards + collections catalog tabs. */
export function applyGlobalCategories(
  hp: HomepageConfig,
  globals: GlobalStoreCategory[],
): HomepageConfig {
  const sorted = [...globals]
    .map((g, i) => ({
      ...g,
      order: typeof g.order === "number" ? g.order : i,
      href: g.href?.trim() || hrefFromCategorySlug(g.slug),
      slug: g.slug.trim() || slugifyCategoryName(g.name) || `category-${i + 1}`,
    }))
    .sort((a, b) => a.order - b.order);

  const homepageCards = sorted
    .filter((g) => g.enabled && g.homepage)
    .map(categoryCardFromGlobal);

  const [allTab, bestTab] = systemCollectionTabs(hp);
  const catalogTabs = sorted
    .filter((g) => g.enabled && g.collections)
    .map((g, i) => ({
      id: g.id,
      label: g.name,
      type: "category" as const,
      value: g.slug,
      enabled: true,
      order: 2 + i,
    }));

  return {
    ...hp,
    globalCategories: sorted,
    categories: {
      ...hp.categories,
      items: homepageCards,
    },
    collectionsPage: {
      ...hp.collectionsPage,
      categories: [
        { ...allTab, order: 0 },
        { ...bestTab, order: 1 },
        ...catalogTabs.map((t, i) => ({ ...t, order: 2 + i })),
      ],
    },
  };
}

export function newGlobalCategory(order: number): GlobalStoreCategory {
  const id = `cat-${Date.now()}`;
  const slug = `category-${order + 1}`;
  return {
    id,
    name: "New category",
    slug,
    image: "",
    href: hrefFromCategorySlug(slug),
    enabled: true,
    order,
    homepage: true,
    collections: true,
  };
}

export function moveGlobalCategory(
  globals: GlobalStoreCategory[],
  index: number,
  dir: -1 | 1,
): GlobalStoreCategory[] {
  const j = index + dir;
  if (j < 0 || j >= globals.length) return globals;
  const next = [...globals].sort((a, b) => a.order - b.order);
  [next[index], next[j]] = [next[j]!, next[index]!];
  return next.map((g, i) => ({ ...g, order: i }));
}
