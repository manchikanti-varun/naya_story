import type {
  CategoryCard,
  HeroSlide,
  HomepageConfig,
  HomepageSectionTextKey,
  SectionTextColors,
  StorefrontTheme,
} from "../types/homepage.js";
import { mergeLayoutBlocksIntoHomepage } from "./layout-blocks.js";
import { defaultHomepageEditorial } from "./editorial-defaults.js";
import type { HomepageEditorialConfig } from "../types/homepage.js";

function sanitizeHexColor(input: string): string | null {
  const s = input.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return null;
  return s;
}

function mergeTheme(raw: unknown): StorefrontTheme {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const pick = (key: keyof StorefrontTheme): string | undefined => {
    const v = r[key];
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v !== "string") return undefined;
    return sanitizeHexColor(v) ?? undefined;
  };
  const out: StorefrontTheme = {};
  const ink = pick("textInk");
  if (ink) out.textInk = ink;
  const muted = pick("textInkMuted");
  if (muted) out.textInkMuted = muted;
  const soft = pick("textInkSoft");
  if (soft) out.textInkSoft = soft;
  const gold = pick("accentGold");
  if (gold) out.accentGold = gold;
  const fg = pick("foreground");
  if (fg) out.foreground = fg;
  return out;
}

const SECTION_TEXT_COLOR_KEYS = ["kicker", "heading", "subheading", "body", "link"] as const;

const SECTION_TEXT_SECTION_KEYS: HomepageSectionTextKey[] = [
  "hero",
  "bestsellers",
  "newIn",
  "categories",
  "newsletter",
  "promoBar",
  "brandStory",
  "lookbook",
  "craftsmanship",
  "asSeenIn",
  "editorialJournal",
  "luxuryPromise",
  "instagramGallery",
];

function mergeEditorial(raw: unknown): HomepageEditorialConfig {
  const d = defaultHomepageEditorial();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;
  const pick = <K extends keyof HomepageEditorialConfig>(key: K): HomepageEditorialConfig[K] => {
    const base = d[key];
    const patch = r[key];
    if (!patch || typeof patch !== "object") return base;
    return { ...base, ...(patch as object) } as HomepageEditorialConfig[K];
  };
  return {
    brandStory: pick("brandStory"),
    lookbook: pick("lookbook"),
    craftsmanship: pick("craftsmanship"),
    asSeenIn: pick("asSeenIn"),
    editorialJournal: pick("editorialJournal"),
    luxuryPromise: pick("luxuryPromise"),
    instagramGallery: pick("instagramGallery"),
  };
}

function mergeOneSectionTextColors(raw: unknown): SectionTextColors | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const out: SectionTextColors = {};
  for (const key of SECTION_TEXT_COLOR_KEYS) {
    const v = r[key];
    if (typeof v !== "string") continue;
    const s = sanitizeHexColor(v);
    if (s) out[key] = s;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function mergeSectionTextColors(
  raw: unknown,
  baseline: HomepageConfig["sectionTextColors"],
): HomepageConfig["sectionTextColors"] | undefined {
  type MapT = NonNullable<HomepageConfig["sectionTextColors"]>;
  const base = { ...(baseline ?? {}) } as MapT;
  if (!raw || typeof raw !== "object") {
    return Object.keys(base).length > 0 ? base : undefined;
  }
  const r = raw as Record<string, unknown>;
  for (const sk of SECTION_TEXT_SECTION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(r, sk)) continue;
    const merged = mergeOneSectionTextColors(r[sk]);
    if (merged) base[sk] = merged;
    else delete base[sk];
  }
  return Object.keys(base).length > 0 ? base : undefined;
}

const IMG = (id: string, w = 1920) =>
  `https://images.unsplash.com/${id}?w=${w}&q=85`;

const defaultSlides: HeroSlide[] = [
  {
    id: "all",
    enabled: true,
    order: 0,
    desktopImage: IMG("photo-1490481651871-ab68de25d43d"),
    mobileImage: "",
    heading: "The full collection",
    subheading: "Every silhouette, one quiet narrative.",
    ctaLabel: "Explore collection",
    ctaHref: "/collections",
  },
  {
    id: "new",
    enabled: true,
    order: 1,
    desktopImage: IMG("photo-1515886657613-9f3515b0c78f"),
    mobileImage: "",
    heading: "New in",
    subheading: "Fresh arrivals — limited, considered, slow.",
    ctaLabel: "Shop now",
    ctaHref: "/collections?collection=new-arrivals",
  },
  {
    id: "bestselling",
    enabled: true,
    order: 2,
    desktopImage: IMG("photo-1548624313-0396c75e4b1a"),
    mobileImage: "",
    heading: "Best selling",
    subheading: "Pieces our clients return to, season after season.",
    ctaLabel: "View bestsellers",
    ctaHref: "/collections?tag=bestseller",
  },
  {
    id: "featured",
    enabled: true,
    order: 3,
    desktopImage: IMG("photo-1469334031218-e382a71b716b"),
    mobileImage: "",
    heading: "Featured collection",
    subheading: "An elevated edit — cinematic and wearable.",
    ctaLabel: "Explore edit",
    ctaHref: "/collections?collection=summer-edit",
  },
];

const defaultCategories: CategoryCard[] = [
  {
    id: "c1",
    name: "Dresses",
    image: IMG("photo-1496747611175-2532220b8043", 1200),
    href: "/collections?category=dresses",
    enabled: true,
    order: 0,
  },
  {
    id: "c2",
    name: "Co-ords",
    image: IMG("photo-1539008835657-9e8e9680c956", 1200),
    href: "/collections?category=tops",
    enabled: true,
    order: 1,
  },
  {
    id: "c3",
    name: "Essentials",
    image: IMG("photo-1509631179647-0177331693ae", 1200),
    href: "/collections?category=outerwear",
    enabled: true,
    order: 2,
  },
];

export function defaultHomepageConfig(): HomepageConfig {
  return {
    theme: {},
    heroTitle: "Naya Story",
    heroSubtitle: "Timeless silhouettes for modern femininity.",
    heroImage: IMG("photo-1521572163474-6864f9cf17ab"),
    announcements: [],
    topPromoBar: {
      enabled: false,
      message: "",
      linkLabel: "",
      linkHref: "",
      variant: "ink",
    },
    carousel: {
      autoplayMs: 12000,
      slides: defaultSlides.map((s) => ({ ...s })),
    },
    sectionsOrder: [
      { id: "bestsellers", enabled: true, order: 0 },
      { id: "newIn", enabled: true, order: 1 },
      { id: "categories", enabled: true, order: 2 },
      { id: "newsletter", enabled: true, order: 3 },
    ],
    editorial: defaultHomepageEditorial(),
    bestsellers: {
      enabled: true,
      title: "Our Bestsellers",
      subtitle: "Most loved pieces from the collection.",
      productIds: [],
    },
    newIn: {
      enabled: true,
      title: "New In",
      subtitle: "The latest silhouettes to arrive in studio.",
      productIds: [],
      ctaLabel: "View all new arrivals",
      ctaHref: "/collections?collection=new-arrivals",
    },
    newInPage: {
      useCuratedOrder: false,
      heading: "New In",
      subheading: "",
      productIds: [],
    },
    categories: {
      enabled: true,
      title: "Shop by category",
      subtitle: "Three moods — three wardrobes.",
      items: defaultCategories.map((c) => ({ ...c })),
    },
    newsletter: {
      enabled: true,
      title: "Notes from Naya Story",
      description:
        "Receive updates on new collections and exclusive releases.",
      placeholder: "Email address",
      buttonLabel: "Subscribe",
    },
    collectionsPage: {
      kicker: "Naya Story",
      title: "Collections",
      subtitle: "Explore curated silhouettes from Naya Story.",
      paginationLimit: 16,
      usePinnedProducts: false,
      pinnedProductIds: [],
      categories: [
        {
          id: "all",
          label: "All",
          type: "all",
          enabled: true,
          order: 0,
        },
        {
          id: "bestselling",
          label: "Bestselling",
          type: "bestselling",
          enabled: true,
          order: 1,
        },
        {
          id: "dresses",
          label: "Dresses",
          type: "category",
          value: "dresses",
          enabled: true,
          order: 2,
        },
        {
          id: "tops",
          label: "Tops",
          type: "category",
          value: "tops",
          enabled: true,
          order: 3,
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
    },
    ourStoryPage: {
      title: "Our Story",
      subtitle: "Designed for modern femininity, rooted in timeless elegance.",
      heroImage: IMG("photo-1529139574466-a303027c1d8b"),
      ctaLabel: "Explore the Collection",
      ctaHref: "/collections",
      sections: [
        {
          id: "philosophy",
          enabled: true,
          order: 0,
          heading: "Our philosophy",
          body: "Naya Story is built on an intentional rhythm - fewer pieces, deeper meaning. We design for women who value softness, clarity, and timeless presence.",
          secondaryBody:
            "Each silhouette is composed to move with the body, balancing elegance with ease from morning to evening.",
          image: IMG("photo-1483985988355-763728e1935b", 1400),
          imageAlt: "Model in neutral tailored look",
        },
        {
          id: "founder",
          enabled: true,
          order: 1,
          heading: "The vision behind Naya Story",
          body: "What began as sketches in a quiet studio became a contemporary wardrobe shaped by craft, femininity, and emotional detail.",
          secondaryBody:
            "Our founder believes luxury should feel intimate - a garment that remembers your movement and reveals confidence without effort.",
          image: IMG("photo-1515886657613-9f3515b0c78f", 1400),
          imageAlt: "Founder portrait mood",
        },
        {
          id: "editorial",
          enabled: true,
          order: 2,
          heading: "Moments, textures, movement",
          body: "From drape to daylight, every frame tells the Naya Story mood - calm, cinematic, and deeply feminine.",
          gallery: [
            IMG("photo-1512436991641-6745cdb1723f", 1200),
            IMG("photo-1496747611175-843222e1935b", 1200),
            IMG("photo-1524504388940-b1c1722653e1", 1200),
            IMG("photo-1487412720507-e7ab37603c6f", 1200),
          ],
        },
        {
          id: "craft",
          enabled: true,
          order: 3,
          heading: "Crafted with intention",
          body: "We source tactile fabrics, refine every line, and fit each pattern for longevity - because true luxury is felt over time.",
          secondaryBody:
            "Tailoring, finishing, and proportion are treated as rituals. Nothing is rushed, and nothing is added without purpose.",
          image: IMG("photo-1445205170230-053b83016050", 1400),
          imageAlt: "Fabric and tailoring detail",
        },
        {
          id: "manifesto",
          enabled: true,
          order: 4,
          heading: "Manifesto",
          body: "Elegance is not about being noticed, but remembered.",
          quote: "Elegance is not about being noticed, but remembered.",
        },
        {
          id: "closing",
          enabled: true,
          order: 5,
          heading: "A wardrobe for becoming",
          body: "Naya Story is a world of quiet confidence, where modern design meets timeless emotion.",
          image: IMG("photo-1469334031218-e382a71b716b", 1800),
          imageAlt: "Closing campaign moment",
        },
      ],
    },
    footer: {
      logoUrl: "/naya_logo.png",
      logoAlt: "Naya Story",
      brandDescription:
        "Naya Story creates timeless silhouettes for modern femininity.",
      supportingText:
        "Designed with intention, elegance, and everyday luxury.",
      legalTitle: "Legal",
      legalLinks: [
        {
          label: "Terms & Conditions",
          href: "/policies/terms",
          enabled: true,
          order: 0,
        },
        {
          label: "Privacy Policy",
          href: "/policies/privacy",
          enabled: true,
          order: 1,
        },
        {
          label: "Refund & Cancellation",
          href: "/policies/refund-cancellation",
          enabled: true,
          order: 2,
        },
        {
          label: "Shipping & Delivery",
          href: "/policies/shipping",
          enabled: true,
          order: 3,
        },
      ],
      contactTitle: "Contact",
      email: "hello@nayastory.com",
      phone: "+91 00000 00000",
      location: "Mumbai, India",
      socialLinks: [
        {
          platform: "instagram",
          href: "https://instagram.com",
          enabled: true,
          order: 0,
        },
        {
          platform: "pinterest",
          href: "https://pinterest.com",
          enabled: true,
          order: 1,
        },
        {
          platform: "facebook",
          href: "https://facebook.com",
          enabled: true,
          order: 2,
        },
      ],
      ctaLinks: [],
      copyrightText: "© 2026 Naya Story. All rights reserved.",
    },
  };
}

function mergeSlides(raw: unknown): HeroSlide[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultSlides.map((s) => ({ ...s }));
  const list = raw
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === "object")
    .map((s, i) => {
      const base = defaultSlides[i % defaultSlides.length];
      return {
        id: String(s.id ?? base.id),
        enabled: s.enabled !== false,
        order: typeof s.order === "number" ? s.order : i,
        desktopImage: String(s.desktopImage || base.desktopImage),
        mobileImage: String(s.mobileImage ?? ""),
        kicker: typeof s.kicker === "string" ? s.kicker : "",
        heading: String(s.heading || base.heading),
        subheading: String(s.subheading ?? base.subheading ?? ""),
        ctaLabel: String(s.ctaLabel ?? base.ctaLabel ?? ""),
        ctaHref: String(s.ctaHref || base.ctaHref),
        metaLabel: typeof s.metaLabel === "string" ? s.metaLabel : "",
        styles:
          s.styles && typeof s.styles === "object"
            ? (s.styles as HeroSlide["styles"])
            : undefined,
        textColors:
          s.textColors && typeof s.textColors === "object"
            ? (s.textColors as HeroSlide["textColors"])
            : undefined,
      } satisfies HeroSlide;
    });
  return list.sort((a, b) => a.order - b.order);
}

function mergeCategories(raw: unknown): CategoryCard[] {
  if (!Array.isArray(raw) || raw.length === 0)
    return defaultCategories.map((c) => ({ ...c }));
  return raw
    .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === "object")
    .map((c, i) => {
      const base = defaultCategories[i % defaultCategories.length];
      return {
        id: String(c.id ?? base.id),
        name: String(c.name || base.name),
        image: String(c.image || base.image),
        href: String(c.href || base.href),
        enabled: c.enabled !== false,
        order: typeof c.order === "number" ? c.order : i,
      } satisfies CategoryCard;
    })
    .sort((a, b) => a.order - b.order);
}

function mergeNewInPage(raw: unknown, fallback: HomepageConfig["newInPage"]): HomepageConfig["newInPage"] {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const r = raw as Record<string, unknown>;
  return {
    useCuratedOrder: r.useCuratedOrder === true,
    heading: typeof r.heading === "string" ? r.heading : fallback.heading,
    subheading: typeof r.subheading === "string" ? r.subheading : fallback.subheading ?? "",
    productIds: Array.isArray(r.productIds) ? r.productIds.map(String) : [],
  };
}

function mergeTopPromoBar(
  raw: unknown,
  fallback: HomepageConfig["topPromoBar"],
): HomepageConfig["topPromoBar"] {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const r = raw as Record<string, unknown>;
  const v = r.variant;
  const variant =
    v === "sand" || v === "gold" || v === "ink" ? v : fallback.variant ?? "ink";
  return {
    enabled: r.enabled === true,
    message: typeof r.message === "string" ? r.message : fallback.message,
    linkLabel: typeof r.linkLabel === "string" ? r.linkLabel : fallback.linkLabel ?? "",
    linkHref: typeof r.linkHref === "string" ? r.linkHref : fallback.linkHref ?? "",
    variant,
  };
}

export function mergeCollectionsPage(
  raw: unknown,
  defaults: HomepageConfig["collectionsPage"],
): HomepageConfig["collectionsPage"] {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const filtersRaw =
    r.filters && typeof r.filters === "object" ? (r.filters as Record<string, unknown>) : {};
  const messagesRaw =
    r.messages && typeof r.messages === "object" ? (r.messages as Record<string, unknown>) : {};
  const dFilters = defaults.filters!;
  const dMessages = defaults.messages!;

  const rawCategories = Array.isArray(r.categories) ? r.categories : defaults.categories;

  const priceBands = Array.isArray(filtersRaw.priceBands)
    ? (filtersRaw.priceBands as Record<string, unknown>[])
        .filter((b) => Boolean(b) && typeof b === "object")
        .map((b, i) => {
          const fb = dFilters.priceBands[i] ?? dFilters.priceBands[0]!;
          return {
            id: String(b.id ?? fb.id),
            label: String(b.label ?? fb.label),
            min: typeof b.min === "number" ? b.min : fb.min,
            max: typeof b.max === "number" ? b.max : fb.max,
            enabled: b.enabled !== false,
          };
        })
    : dFilters.priceBands;

  const sortValues = new Set(["newest", "popular", "price_asc", "price_desc"]);
  const sortOptions = Array.isArray(filtersRaw.sortOptions)
    ? (filtersRaw.sortOptions as Record<string, unknown>[])
        .filter((s) => Boolean(s) && typeof s === "object")
        .map((s, i) => {
          const fb = dFilters.sortOptions[i] ?? dFilters.sortOptions[0]!;
          const valueRaw = String(s.value ?? fb.value);
          const value = sortValues.has(valueRaw) ? (valueRaw as typeof fb.value) : fb.value;
          return {
            value,
            label: String(s.label ?? fb.label),
            enabled: s.enabled !== false,
          };
        })
    : dFilters.sortOptions;

  const defaultSortRaw = String(filtersRaw.defaultSort ?? dFilters.defaultSort);
  const defaultSort = sortValues.has(defaultSortRaw)
    ? (defaultSortRaw as typeof dFilters.defaultSort)
    : dFilters.defaultSort;

  return {
    kicker: typeof r.kicker === "string" ? r.kicker : defaults.kicker,
    title: typeof r.title === "string" ? r.title : defaults.title,
    subtitle: typeof r.subtitle === "string" ? r.subtitle : defaults.subtitle,
    paginationLimit:
      typeof r.paginationLimit === "number"
        ? Math.min(Math.max(r.paginationLimit, 8), 48)
        : defaults.paginationLimit,
    usePinnedProducts: r.usePinnedProducts === true,
    pinnedProductIds: Array.isArray(r.pinnedProductIds)
      ? r.pinnedProductIds.map(String).filter(Boolean)
      : [],
    categories: rawCategories
      .filter((entry) => Boolean(entry) && typeof entry === "object")
      .map((entry, index) => {
        const safe = entry as Record<string, unknown>;
        const fallback = defaults.categories[index % defaults.categories.length];
        const typeRaw = safe.type;
        const type =
          typeRaw === "all" || typeRaw === "bestselling" || typeRaw === "category"
            ? typeRaw
            : fallback.type;
        return {
          id: String(safe.id ?? fallback.id),
          label: String(safe.label ?? fallback.label),
          type,
          value: String(safe.value ?? fallback.value ?? ""),
          enabled: safe.enabled !== false,
          order: typeof safe.order === "number" ? safe.order : index,
        };
      })
      .sort((a, b) => a.order - b.order),
    filters: {
      showSize: filtersRaw.showSize !== false,
      showColor: filtersRaw.showColor !== false,
      showPrice: filtersRaw.showPrice !== false,
      showAvailability: filtersRaw.showAvailability !== false,
      showSort: filtersRaw.showSort !== false,
      sizeOptions: Array.isArray(filtersRaw.sizeOptions)
        ? filtersRaw.sizeOptions.map(String).filter(Boolean)
        : dFilters.sizeOptions,
      colorOptions: Array.isArray(filtersRaw.colorOptions)
        ? filtersRaw.colorOptions.map(String).filter(Boolean)
        : dFilters.colorOptions,
      priceBands: priceBands.length ? priceBands : dFilters.priceBands,
      sortOptions: sortOptions.length ? sortOptions : dFilters.sortOptions,
      defaultSort,
    },
    messages: {
      loading:
        typeof messagesRaw.loading === "string" ? messagesRaw.loading : dMessages.loading,
      empty: typeof messagesRaw.empty === "string" ? messagesRaw.empty : dMessages.empty,
      mobileFiltersLabel:
        typeof messagesRaw.mobileFiltersLabel === "string"
          ? messagesRaw.mobileFiltersLabel
          : dMessages.mobileFiltersLabel,
      mobileDrawerTitle:
        typeof messagesRaw.mobileDrawerTitle === "string"
          ? messagesRaw.mobileDrawerTitle
          : dMessages.mobileDrawerTitle,
      availabilityInStock:
        typeof messagesRaw.availabilityInStock === "string"
          ? messagesRaw.availabilityInStock
          : dMessages.availabilityInStock,
      availabilityAll:
        typeof messagesRaw.availabilityAll === "string"
          ? messagesRaw.availabilityAll
          : dMessages.availabilityAll,
      filterAll:
        typeof messagesRaw.filterAll === "string" ? messagesRaw.filterAll : dMessages.filterAll,
    },
  };
}

export function mergeHomepageConfig(
  raw: Partial<HomepageConfig> | null | undefined,
): HomepageConfig {
  const d = defaultHomepageConfig();
  if (!raw || typeof raw !== "object") return mergeLayoutBlocksIntoHomepage(d, null);
  const r = raw as Record<string, unknown>;
  const carousel = (r.carousel as HomepageConfig["carousel"]) || d.carousel;
  const sectionsOrder = Array.isArray(r.sectionsOrder)
    ? (r.sectionsOrder as HomepageConfig["sectionsOrder"]).map((s, idx) => ({
        id: s.id,
        enabled: s.enabled !== false,
        order: typeof s.order === "number" ? s.order : idx,
      }))
    : d.sectionsOrder;
  const bestsellers = { ...d.bestsellers, ...(r.bestsellers as object) };
  const newIn = { ...d.newIn, ...(r.newIn as object) };
  const catRaw = r.categories as HomepageConfig["categories"] | undefined;
  const newsletter = { ...d.newsletter, ...(r.newsletter as object) };
  const ourStoryPage = {
    ...d.ourStoryPage,
    ...((r.ourStoryPage as object) ?? {}),
  } as HomepageConfig["ourStoryPage"];
  const rawStorySections = Array.isArray(ourStoryPage.sections)
    ? ourStoryPage.sections
    : d.ourStoryPage.sections;
  const footer = { ...d.footer, ...((r.footer as object) ?? {}) } as HomepageConfig["footer"];
  const merged: HomepageConfig = {
    ...d,
    ...r,
    heroTitle: typeof r.heroTitle === "string" ? r.heroTitle : d.heroTitle,
    heroSubtitle: typeof r.heroSubtitle === "string" ? r.heroSubtitle : d.heroSubtitle,
    heroImage: typeof r.heroImage === "string" ? r.heroImage : d.heroImage,
    announcements: Array.isArray(r.announcements)
      ? (r.announcements as string[])
      : d.announcements,
    topPromoBar: mergeTopPromoBar(r.topPromoBar, d.topPromoBar),
    carousel: {
      autoplayMs:
        typeof carousel.autoplayMs === "number"
          ? carousel.autoplayMs
          : d.carousel.autoplayMs,
      styles:
        carousel.styles && typeof carousel.styles === "object"
          ? (carousel.styles as HomepageConfig["carousel"]["styles"])
          : d.carousel.styles,
      slides: mergeSlides(carousel.slides),
    },
    sectionsOrder,
    editorial: mergeEditorial(r.editorial),
    bestsellers: {
      ...bestsellers,
      productIds: Array.isArray(bestsellers.productIds)
        ? bestsellers.productIds.map(String)
        : [],
    },
    newIn: {
      ...newIn,
      productIds: Array.isArray(newIn.productIds)
        ? newIn.productIds.map(String)
        : [],
    },
    newInPage: mergeNewInPage(r.newInPage, d.newInPage),
    categories: {
      ...d.categories,
      ...catRaw,
      items: mergeCategories(catRaw?.items),
    },
    newsletter,
    collectionsPage: mergeCollectionsPage(r.collectionsPage, d.collectionsPage),
    ourStoryPage: {
      title:
        typeof ourStoryPage.title === "string" ? ourStoryPage.title : d.ourStoryPage.title,
      subtitle:
        typeof ourStoryPage.subtitle === "string"
          ? ourStoryPage.subtitle
          : d.ourStoryPage.subtitle,
      heroImage:
        typeof ourStoryPage.heroImage === "string"
          ? ourStoryPage.heroImage
          : d.ourStoryPage.heroImage,
      ctaLabel:
        typeof ourStoryPage.ctaLabel === "string"
          ? ourStoryPage.ctaLabel
          : d.ourStoryPage.ctaLabel,
      ctaHref:
        typeof ourStoryPage.ctaHref === "string"
          ? ourStoryPage.ctaHref
          : d.ourStoryPage.ctaHref,
      sections: rawStorySections
        .filter((s) => Boolean(s) && typeof s === "object")
        .map((s, index) => {
          const safe = s as Record<string, unknown>;
          const fallback = d.ourStoryPage.sections[index % d.ourStoryPage.sections.length];
          const idRaw = safe.id;
          const id =
            idRaw === "philosophy" ||
            idRaw === "founder" ||
            idRaw === "editorial" ||
            idRaw === "craft" ||
            idRaw === "manifesto" ||
            idRaw === "closing"
              ? idRaw
              : fallback.id;
          return {
            id,
            enabled: safe.enabled !== false,
            order: typeof safe.order === "number" ? safe.order : index,
            heading: String(safe.heading ?? fallback.heading),
            body: String(safe.body ?? fallback.body),
            image: String(safe.image ?? fallback.image ?? ""),
            imageAlt: String(safe.imageAlt ?? fallback.imageAlt ?? ""),
            quote: String(safe.quote ?? fallback.quote ?? ""),
            secondaryBody: String(safe.secondaryBody ?? fallback.secondaryBody ?? ""),
            gallery: Array.isArray(safe.gallery)
              ? safe.gallery.map(String).filter(Boolean)
              : fallback.gallery ?? [],
          };
        })
        .sort((a, b) => a.order - b.order),
    },
    footer: {
      logoUrl: typeof footer.logoUrl === "string" ? footer.logoUrl : d.footer.logoUrl,
      logoAlt: typeof footer.logoAlt === "string" ? footer.logoAlt : d.footer.logoAlt,
      brandDescription:
        typeof footer.brandDescription === "string"
          ? footer.brandDescription
          : d.footer.brandDescription,
      supportingText:
        typeof footer.supportingText === "string"
          ? footer.supportingText
          : d.footer.supportingText,
      legalTitle: typeof footer.legalTitle === "string" ? footer.legalTitle : d.footer.legalTitle,
      legalLinks: (Array.isArray(footer.legalLinks) ? footer.legalLinks : d.footer.legalLinks)
        .filter((link) => Boolean(link) && typeof link === "object")
        .map((link, index) => {
          const safe = link as Record<string, unknown>;
          const fallback = d.footer.legalLinks[index % d.footer.legalLinks.length];
          return {
            label: String(safe.label ?? fallback.label),
            href: String(safe.href ?? fallback.href),
            enabled: safe.enabled !== false,
            order: typeof safe.order === "number" ? safe.order : index,
          };
        })
        .sort((a, b) => a.order - b.order),
      contactTitle:
        typeof footer.contactTitle === "string" ? footer.contactTitle : d.footer.contactTitle,
      email: typeof footer.email === "string" ? footer.email : d.footer.email,
      phone: typeof footer.phone === "string" ? footer.phone : d.footer.phone,
      location: typeof footer.location === "string" ? footer.location : d.footer.location,
      socialLinks: (Array.isArray(footer.socialLinks) ? footer.socialLinks : d.footer.socialLinks)
        .filter((link) => Boolean(link) && typeof link === "object")
        .map((link, index) => {
          const safe = link as Record<string, unknown>;
          const fallback = d.footer.socialLinks[index % d.footer.socialLinks.length];
          const platformRaw = safe.platform;
          const platform =
            platformRaw === "instagram" || platformRaw === "pinterest" || platformRaw === "facebook"
              ? platformRaw
              : fallback.platform;
          return {
            platform,
            href: String(safe.href ?? fallback.href),
            enabled: safe.enabled !== false,
            order: typeof safe.order === "number" ? safe.order : index,
          };
        })
        .sort((a, b) => a.order - b.order),
      ctaLinks: (Array.isArray(footer.ctaLinks) ? footer.ctaLinks : d.footer.ctaLinks)
        .filter((link) => Boolean(link) && typeof link === "object")
        .map((link, index) => {
          const safe = link as Record<string, unknown>;
          const fallback = d.footer.ctaLinks[index % d.footer.ctaLinks.length];
          return {
            label: String(safe.label ?? fallback.label),
            href: String(safe.href ?? fallback.href),
            enabled: safe.enabled !== false,
            order: typeof safe.order === "number" ? safe.order : index,
          };
        })
        .sort((a, b) => a.order - b.order),
      copyrightText:
        typeof footer.copyrightText === "string"
          ? footer.copyrightText
          : d.footer.copyrightText,
    },
    theme: mergeTheme(r.theme),
    sectionTextColors: mergeSectionTextColors(r.sectionTextColors, d.sectionTextColors),
  };
  return mergeLayoutBlocksIntoHomepage(merged, r.layoutBlocks);
}
