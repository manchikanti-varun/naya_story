export type HeroSlide = {
  id: string;
  enabled: boolean;
  order: number;
  desktopImage: string;
  mobileImage?: string;
  kicker?: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref: string;
  metaLabel?: string;
  styles?: SectionDesign;
  textColors?: SectionTextColors;
  matchPreviousSlideStyles?: boolean;
};

export type SectionOrderEntry = {
  id: "bestsellers" | "newIn" | "categories" | "newsletter";
  enabled: boolean;
  order: number;
};

export type CategoryCard = {
  id: string;
  name: string;
  image: string;
  href: string;
  enabled: boolean;
  order: number;
};

export type GlobalStoreCategory = {
  id: string;
  name: string;
  slug: string;
  image: string;
  href: string;
  enabled: boolean;
  order: number;
  homepage: boolean;
  collections: boolean;
  pinnedProductIds?: string[];
};

export type TopPromoBarConfig = {
  enabled: boolean;
  message: string;
  linkLabel?: string;
  linkHref?: string;
  variant?: "ink" | "sand" | "gold";
};

export type SectionTextColors = Partial<{
  kicker: string;
  heading: string;
  subheading: string;
  body: string;
  link: string;
}>;

export type HomepageSectionTextKey =
  | "hero"
  | "bestsellers"
  | "newIn"
  | "categories"
  | "newsletter"
  | "promoBar"
  | "brandStory"
  | "lookbook"
  | "craftsmanship"
  | "asSeenIn"
  | "editorialJournal"
  | "luxuryPromise"
  | "instagramGallery";

export type SectionDesign = {
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonHoverColor?: string;
  buttonTextColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  paddingTop?: string;
  paddingBottom?: string;
  maxWidth?: string;
  align?: "left" | "center" | "right";
  mode?: "light" | "dark";
  borderRadius?: string;
  opacity?: number;
  headingFont?: "display" | "sans";
  headingFontSize?: string;
  subheadingFontSize?: string;
  kickerFontSize?: string;
  ctaFontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
};

export type CmsSectionBase = {
  enabled?: boolean;
  styles?: SectionDesign;
};

export type HomepageEditorialConfig = {
  brandStory: CmsSectionBase & {
    kicker: string;
    title: string;
    body: string[];
    image: string;
    imageAlt: string;
  };
  lookbook: CmsSectionBase & {
    kicker: string;
    title: string;
    subtitle: string;
    shots: Array<{ src: string; span: string; aspect: string }>;
  };
  craftsmanship: CmsSectionBase & {
    kicker: string;
    title: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
    imageAlt: string;
  };
  asSeenIn: CmsSectionBase & {
    kicker: string;
    names: string[];
  };
  editorialJournal: CmsSectionBase & {
    kicker: string;
    title: string;
    linkLabel: string;
    linkHref: string;
    stories: Array<{
      title: string;
      excerpt: string;
      image: string;
      href: string;
    }>;
  };
  luxuryPromise: CmsSectionBase & {
    kicker: string;
    title: string;
    items: Array<{ title: string; copy: string }>;
  };
  instagramGallery: CmsSectionBase & {
    kicker: string;
    title: string;
    images: string[];
    linkHref: string;
  };
};

/** Optional hex overrides (#rgb, #rrggbb, #rrggbbaa) for storefront typography — applied as CSS variables. */
export type StorefrontTheme = {
  textInk?: string;
  textInkMuted?: string;
  textInkSoft?: string;
  accentGold?: string;
  /** When set, updates `body`/default text via `--foreground`. */
  foreground?: string;
};

export type HomepageLayoutBlockType =
  | "promoBar"
  | "theme"
  | "hero"
  | "brandStory"
  | "bestsellers"
  | "lookbook"
  | "newIn"
  | "craftsmanship"
  | "categories"
  | "asSeenIn"
  | "editorialJournal"
  | "luxuryPromise"
  | "instagramGallery"
  | "newsletter"
  | "footer";

/** Persisted manifest: block order + visibility (canonical copy data remains in hero, sections, promo, etc.). */
export type HomepageLayoutBlock = {
  id: string;
  type: HomepageLayoutBlockType;
  enabled: boolean;
  order: number;
};

export type HomepageConfig = {
  theme?: StorefrontTheme;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  announcements?: string[];
  topPromoBar: TopPromoBarConfig;
  carousel: {
    autoplayMs: number;
    styles?: SectionDesign;
    slides: HeroSlide[];
  };
  sectionsOrder: SectionOrderEntry[];
  editorial?: HomepageEditorialConfig;
  bestsellers: {
    enabled?: boolean;
    kicker?: string;
    title: string;
    subtitle: string;
    productIds: string[];
    ctaLabel?: string;
    ctaHref?: string;
    styles?: SectionDesign;
  };
  newIn: {
    enabled?: boolean;
    kicker?: string;
    title: string;
    subtitle: string;
    productIds: string[];
    ctaLabel: string;
    ctaHref: string;
    styles?: SectionDesign;
  };
  newInPage: {
    /** When false, `/new-in` is hidden and returns shoppers to home. */
    enabled?: boolean;
    useCuratedOrder: boolean;
    heading: string;
    subheading?: string;
    productIds: string[];
  };
  globalCategories?: GlobalStoreCategory[];
  categories: {
    enabled?: boolean;
    kicker?: string;
    title: string;
    subtitle: string;
    items: CategoryCard[];
    ctaLabel?: string;
    ctaHref?: string;
    styles?: SectionDesign;
  };
  newsletter: {
    enabled?: boolean;
    title: string;
    description: string;
    placeholder: string;
    buttonLabel: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    styles?: SectionDesign;
  };
  collectionsPage: {
    /** When false, `/collections` is hidden and returns shoppers to home. */
    enabled?: boolean;
    kicker: string;
    title: string;
    subtitle: string;
    paginationLimit: number;
    usePinnedProducts?: boolean;
    pinnedProductIds?: string[];
    categories: Array<{
      id: string;
      label: string;
      type: "all" | "bestselling" | "newIn" | "category";
      value?: string;
      enabled: boolean;
      order: number;
    }>;
    filters?: {
      showSize: boolean;
      showColor: boolean;
      showPrice: boolean;
      showAvailability: boolean;
      showSort: boolean;
      sizeOptions: string[];
      colorOptions: string[];
      priceBands: Array<{
        id: string;
        label: string;
        min: number;
        max?: number;
        enabled: boolean;
      }>;
      sortOptions: Array<{
        value: "newest" | "popular" | "price_asc" | "price_desc";
        label: string;
        enabled: boolean;
      }>;
      defaultSort: "newest" | "popular" | "price_asc" | "price_desc";
    };
    messages?: {
      loading: string;
      empty: string;
      mobileFiltersLabel: string;
      mobileDrawerTitle: string;
      availabilityInStock: string;
      availabilityAll: string;
      filterAll: string;
    };
  };
  ourStoryPage: {
    /** When false, `/our-story` is hidden and returns shoppers to home. */
    enabled?: boolean;
    title: string;
    subtitle: string;
    heroImage: string;
    ctaLabel: string;
    ctaHref: string;
    sections: Array<{
      id:
        | "philosophy"
        | "founder"
        | "editorial"
        | "craft"
        | "manifesto"
        | "closing";
      enabled: boolean;
      order: number;
      heading: string;
      body: string;
      image?: string;
      imageAlt?: string;
      quote?: string;
      secondaryBody?: string;
      gallery?: string[];
    }>;
  };
  sectionTextColors?: Partial<Record<HomepageSectionTextKey, SectionTextColors>>;
  footer: {
    logoUrl: string;
    logoAlt: string;
    brandDescription: string;
    supportingText: string;
    legalTitle: string;
    legalLinks: Array<{ label: string; href: string; enabled: boolean; order: number }>;
    contactTitle: string;
    email: string;
    phone: string;
    location: string;
    socialLinks: Array<{
      platform: "instagram" | "pinterest" | "facebook";
      href: string;
      enabled: boolean;
      order: number;
    }>;
    ctaLinks: Array<{ label: string; href: string; enabled: boolean; order: number }>;
    copyrightText: string;
  };
  layoutBlocks?: HomepageLayoutBlock[];
};
