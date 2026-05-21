import type { HomepageConfig, HomepageEditorialConfig } from "../types/homepage.js";
import { defaultHomepageConfig } from "./homepage-defaults.js";
import { attachLayoutBlocks } from "./layout-blocks.js";

function emptyHomepageEditorial(): HomepageEditorialConfig {
  return {
    brandStory: {
      enabled: false,
      kicker: "",
      title: "",
      body: [],
      image: "",
      imageAlt: "",
    },
    lookbook: {
      enabled: false,
      kicker: "",
      title: "",
      subtitle: "",
      shots: [],
    },
    craftsmanship: {
      enabled: false,
      kicker: "",
      title: "",
      body: "",
      ctaLabel: "",
      ctaHref: "",
      image: "",
      imageAlt: "",
    },
    asSeenIn: {
      enabled: false,
      kicker: "",
      names: [],
    },
    editorialJournal: {
      enabled: false,
      kicker: "",
      title: "",
      linkLabel: "",
      linkHref: "",
      stories: [],
    },
    luxuryPromise: {
      enabled: false,
      kicker: "",
      title: "",
      items: [],
    },
    instagramGallery: {
      enabled: false,
      kicker: "",
      title: "",
      images: [],
      linkHref: "",
    },
  };
}

/**
 * Blank published homepage: no hero slides, no demo Unsplash rails, all layout blocks off.
 * Does not run through mergeHomepageConfig (that re-injects default demo media).
 */
export function blankStorefrontHomepage(): HomepageConfig {
  const hp = defaultHomepageConfig();
  hp.heroTitle = "";
  hp.heroSubtitle = "";
  hp.heroImage = "";
  hp.topPromoBar = { ...hp.topPromoBar, enabled: false, message: "" };
  hp.carousel.slides = [];
  hp.sectionsOrder = hp.sectionsOrder.map((s) => ({ ...s, enabled: false }));
  hp.editorial = emptyHomepageEditorial();
  hp.bestsellers = { ...hp.bestsellers, enabled: false, productIds: [], title: "", subtitle: "" };
  hp.newIn = {
    ...hp.newIn,
    enabled: false,
    productIds: [],
    title: "",
    subtitle: "",
  };
  hp.newInPage = { ...hp.newInPage, productIds: [] };
  hp.categories = { ...hp.categories, enabled: false, items: [], title: "", subtitle: "" };
  hp.newsletter = { ...hp.newsletter, enabled: false, title: "", description: "" };
  hp.collectionsPage = {
    ...hp.collectionsPage,
    pinnedProductIds: [],
    usePinnedProducts: false,
  };

  const withBlocks = attachLayoutBlocks(hp);
  return {
    ...withBlocks,
    layoutBlocks: (withBlocks.layoutBlocks ?? []).map((b) => ({
      ...b,
      enabled: false,
    })),
  };
}
