export type HeroSlide = {
  id: string;
  enabled: boolean;
  order: number;
  desktopImage: string;
  mobileImage?: string;
  /** Eyebrow above heading; blank = site name + slide index. */
  kicker?: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref: string;
  /** Small label on the right column (e.g. season tag). */
  metaLabel?: string;
  /** Per-slide colors, overlay, typography, and layout overrides. */
  styles?: SectionDesign;
  /** Per-slide text color overrides (heading, subheading, CTA, kicker). */
  textColors?: SectionTextColors;
  /** When true, uses the previous slide’s design & text colors (by carousel order). */
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

/** Thin strip above the main nav — coupons, shipping notes, etc. */
export type TopPromoBarConfig = {
  enabled: boolean;
  /** Plain text (shown in one scrolling line). */
  message: string;
  linkLabel?: string;
  linkHref?: string;
  /** Visual treatment of the strip */
  variant?: "ink" | "sand" | "gold";
};

/** Per-role hex overrides for a single homepage block (sanitized server-side). */
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

/** Per-section design controls from admin (does not change layout structure). */
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
  /** Typography overrides (CSS values). */
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

/** Optional hex overrides for storefront text (see Tailwind `text-ink`, `text-gold`, etc.). */
export type StorefrontTheme = {
  textInk?: string;
  textInkMuted?: string;
  textInkSoft?: string;
  accentGold?: string;
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

/** Storefront-only blocks rendered on `/` (excludes global chrome). */
export type HomepageStorefrontBlockType = Exclude<
  HomepageLayoutBlockType,
  "promoBar" | "theme" | "footer"
>;

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
  /** Sticky promo above navbar (dismiss hides until message changes). */
  topPromoBar: TopPromoBarConfig;
  carousel: {
    autoplayMs: number;
    /** Default design for all slides (overridden per slide when set). */
    styles?: SectionDesign;
    slides: HeroSlide[];
  };
  sectionsOrder: SectionOrderEntry[];
  /** Editorial / story blocks (same UI as before — now CMS-driven). */
  editorial?: HomepageEditorialConfig;
  bestsellers: {
    enabled?: boolean;
    title: string;
    subtitle: string;
    productIds: string[];
    ctaLabel?: string;
    ctaHref?: string;
    styles?: SectionDesign;
  };
  newIn: {
    enabled?: boolean;
    title: string;
    subtitle: string;
    productIds: string[];
    ctaLabel: string;
    ctaHref: string;
    styles?: SectionDesign;
  };
  /** Full `/new-in` page: copy + optional fixed product order (curated). */
  newInPage: {
    /** When false, `/new-in` is hidden and returns shoppers to home. */
    enabled?: boolean;
    useCuratedOrder: boolean;
    heading: string;
    subheading?: string;
    productIds: string[];
  };
  categories: {
    enabled?: boolean;
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
    /** When true and shopper is on the “All” tab page 1, pinned products appear first in this order. */
    usePinnedProducts?: boolean;
    pinnedProductIds?: string[];
    categories: Array<{
      id: string;
      label: string;
      type: "all" | "bestselling" | "category";
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
  /** Optional typography colors per homepage section (inline styles on storefront). */
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
