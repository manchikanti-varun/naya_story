import type { HomepageConfig } from "@/types/homepage";
import { SITE_NAME } from "@/lib/constants";

export type CollectionsPageConfig = HomepageConfig["collectionsPage"];

export const DEFAULT_COLLECTIONS_PAGE: CollectionsPageConfig = {
  kicker: SITE_NAME,
  title: "Collections",
  subtitle: `Explore curated silhouettes from ${SITE_NAME}.`,
  paginationLimit: 16,
  usePinnedProducts: false,
  pinnedProductIds: [],
  categories: [
    { id: "all", label: "All", type: "all", enabled: true, order: 0 },
    { id: "bestselling", label: "Bestselling", type: "bestselling", enabled: true, order: 1 },
    {
      id: "dresses",
      label: "Dresses",
      type: "category",
      value: "dresses",
      enabled: true,
      order: 2,
    },
  ],
  filters: {
    showSize: true,
    showColor: true,
    showPrice: true,
    showAvailability: true,
    showSort: true,
    sizeOptions: ["XS", "S", "M", "L", "XL"],
    colorOptions: ["Ivory", "Sand", "Noir", "Rose"],
    priceBands: [
      { id: "0-5000", label: "Under ₹5,000", min: 0, max: 5000, enabled: true },
      { id: "5000-10000", label: "₹5,000 – ₹10,000", min: 5000, max: 10000, enabled: true },
      { id: "10000-25000", label: "₹10,000 – ₹25,000", min: 10000, max: 25000, enabled: true },
      { id: "25000-50000", label: "₹25,000 – ₹50,000", min: 25000, max: 50000, enabled: true },
    ],
    sortOptions: [
      { value: "newest", label: "Newest", enabled: true },
      { value: "popular", label: "Bestselling", enabled: true },
      { value: "price_asc", label: "Price low–high", enabled: true },
      { value: "price_desc", label: "Price high–low", enabled: true },
      { value: "manual", label: "Curated", enabled: true },
    ],
    defaultSort: "newest",
  },
  messages: {
    loading: "Curating pieces…",
    empty: "No garments matched — soften your filters.",
    mobileFiltersLabel: "Filters & Sort",
    mobileDrawerTitle: "Refine",
    availabilityInStock: "In stock",
    availabilityAll: "All",
    filterAll: "All",
  },
};

/** Merge partial CMS data with defaults (storefront-safe). */
export function normalizeCollectionsPage(
  raw?: Partial<CollectionsPageConfig> | null,
): CollectionsPageConfig {
  const d = DEFAULT_COLLECTIONS_PAGE;
  if (!raw) return d;

  const filtersRaw = { ...d.filters!, ...(raw.filters ?? {}) };
  const messagesRaw = { ...d.messages!, ...(raw.messages ?? {}) };

  const priceBands = Array.isArray(filtersRaw.priceBands)
    ? filtersRaw.priceBands
        .filter((b) => b && typeof b === "object")
        .map((b, i) => {
          const fb = d.filters!.priceBands[i] ?? d.filters!.priceBands[0]!;
          return {
            id: String(b.id ?? fb.id),
            label: String(b.label ?? fb.label),
            min: typeof b.min === "number" ? b.min : fb.min,
            max: typeof b.max === "number" ? b.max : fb.max,
            enabled: b.enabled !== false,
          };
        })
    : d.filters!.priceBands;

  const sortOptions = Array.isArray(filtersRaw.sortOptions)
    ? filtersRaw.sortOptions
        .filter((s) => s && typeof s === "object")
        .map((s, i) => {
          const fb = d.filters!.sortOptions[i] ?? d.filters!.sortOptions[0]!;
          const value = s.value ?? fb.value;
          const allowed = ["newest", "popular", "price_asc", "price_desc"] as const;
          return {
            value: allowed.includes(value as (typeof allowed)[number])
              ? (value as (typeof allowed)[number])
              : fb.value,
            label: String(s.label ?? fb.label),
            enabled: s.enabled !== false,
          };
        })
    : d.filters!.sortOptions;

  const categories = Array.isArray(raw.categories)
    ? raw.categories
        .filter((c) => c && typeof c === "object")
        .map((c, i) => {
          const fb = d.categories[i] ?? d.categories[0]!;
          const type =
            c.type === "all" || c.type === "bestselling" || c.type === "category"
              ? c.type
              : fb.type;
          return {
            id: String(c.id ?? fb.id),
            label: String(c.label ?? fb.label),
            type,
            value: String(c.value ?? fb.value ?? ""),
            enabled: c.enabled !== false,
            order: typeof c.order === "number" ? c.order : i,
          };
        })
        .sort((a, b) => a.order - b.order)
    : d.categories;

  const defaultSortRaw = filtersRaw.defaultSort ?? d.filters!.defaultSort;
  const defaultSort =
    defaultSortRaw === "popular" ||
    defaultSortRaw === "price_asc" ||
    defaultSortRaw === "price_desc"
      ? defaultSortRaw
      : "newest";

  return {
    kicker: typeof raw.kicker === "string" ? raw.kicker : d.kicker,
    title: typeof raw.title === "string" ? raw.title : d.title,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : d.subtitle,
    paginationLimit:
      typeof raw.paginationLimit === "number"
        ? Math.min(Math.max(raw.paginationLimit, 8), 48)
        : d.paginationLimit,
    usePinnedProducts: raw.usePinnedProducts === true,
    pinnedProductIds: Array.isArray(raw.pinnedProductIds)
      ? raw.pinnedProductIds.map(String).filter(Boolean)
      : [],
    categories,
    filters: {
      showSize: filtersRaw.showSize !== false,
      showColor: filtersRaw.showColor !== false,
      showPrice: filtersRaw.showPrice !== false,
      showAvailability: filtersRaw.showAvailability !== false,
      showSort: filtersRaw.showSort !== false,
      sizeOptions: Array.isArray(filtersRaw.sizeOptions)
        ? filtersRaw.sizeOptions.map(String).filter(Boolean)
        : d.filters!.sizeOptions,
      colorOptions: Array.isArray(filtersRaw.colorOptions)
        ? filtersRaw.colorOptions.map(String).filter(Boolean)
        : d.filters!.colorOptions,
      priceBands: priceBands.length ? priceBands : d.filters!.priceBands,
      sortOptions: sortOptions.length ? sortOptions : d.filters!.sortOptions,
      defaultSort,
    },
    messages: {
      loading: typeof messagesRaw.loading === "string" ? messagesRaw.loading : d.messages!.loading,
      empty: typeof messagesRaw.empty === "string" ? messagesRaw.empty : d.messages!.empty,
      mobileFiltersLabel:
        typeof messagesRaw.mobileFiltersLabel === "string"
          ? messagesRaw.mobileFiltersLabel
          : d.messages!.mobileFiltersLabel,
      mobileDrawerTitle:
        typeof messagesRaw.mobileDrawerTitle === "string"
          ? messagesRaw.mobileDrawerTitle
          : d.messages!.mobileDrawerTitle,
      availabilityInStock:
        typeof messagesRaw.availabilityInStock === "string"
          ? messagesRaw.availabilityInStock
          : d.messages!.availabilityInStock,
      availabilityAll:
        typeof messagesRaw.availabilityAll === "string"
          ? messagesRaw.availabilityAll
          : d.messages!.availabilityAll,
      filterAll:
        typeof messagesRaw.filterAll === "string" ? messagesRaw.filterAll : d.messages!.filterAll,
    },
  };
}
