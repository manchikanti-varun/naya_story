export type HeroSlide = {
  id: string;
  enabled: boolean;
  order: number;
  desktopImage: string;
  mobileImage?: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref: string;
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
  | "promoBar";

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
  | "bestsellers"
  | "newIn"
  | "categories"
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
    slides: HeroSlide[];
  };
  sectionsOrder: SectionOrderEntry[];
  bestsellers: {
    enabled?: boolean;
    title: string;
    subtitle: string;
    productIds: string[];
  };
  newIn: {
    enabled?: boolean;
    title: string;
    subtitle: string;
    productIds: string[];
    ctaLabel: string;
    ctaHref: string;
  };
  newInPage: {
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
  };
  newsletter: {
    enabled?: boolean;
    title: string;
    description: string;
    placeholder: string;
    buttonLabel: string;
  };
  collectionsPage: {
    title: string;
    subtitle: string;
    paginationLimit: number;
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
  };
  ourStoryPage: {
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
