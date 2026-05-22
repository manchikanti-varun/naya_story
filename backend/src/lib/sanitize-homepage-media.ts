import type { HomepageConfig, HomepageEditorialConfig } from "../types/homepage.js";
import { stripUnsplashUrl, stripUnsplashUrls } from "./strip-unsplash.js";

function sanitizeEditorial(ed: HomepageEditorialConfig): HomepageEditorialConfig {
  return {
    ...ed,
    brandStory: {
      ...ed.brandStory,
      image: stripUnsplashUrl(ed.brandStory.image),
    },
    lookbook: {
      ...ed.lookbook,
      shots: ed.lookbook.shots.map((s) => ({ ...s, src: stripUnsplashUrl(s.src) })),
    },
    craftsmanship: {
      ...ed.craftsmanship,
      image: stripUnsplashUrl(ed.craftsmanship.image),
    },
    editorialJournal: {
      ...ed.editorialJournal,
      stories: ed.editorialJournal.stories.map((s) => ({
        ...s,
        image: stripUnsplashUrl(s.image),
      })),
    },
    instagramGallery: {
      ...ed.instagramGallery,
      images: stripUnsplashUrls(ed.instagramGallery.images),
    },
  };
}

/** Removes all Unsplash demo URLs from homepage CMS config (draft + live). */
export function sanitizeHomepageFromUnsplash(hp: HomepageConfig): HomepageConfig {
  return {
    ...hp,
    heroImage: stripUnsplashUrl(hp.heroImage),
    carousel: {
      ...hp.carousel,
      slides: hp.carousel.slides.map((s) => ({
        ...s,
        desktopImage: stripUnsplashUrl(s.desktopImage),
        mobileImage: stripUnsplashUrl(s.mobileImage),
      })),
    },
    categories: {
      ...hp.categories,
      items: hp.categories.items.map((c) => ({
        ...c,
        image: stripUnsplashUrl(c.image),
      })),
    },
    editorial: sanitizeEditorial(hp.editorial),
    ourStoryPage: {
      ...hp.ourStoryPage,
      heroImage: stripUnsplashUrl(hp.ourStoryPage.heroImage),
      sections: hp.ourStoryPage.sections.map((sec) => ({
        ...sec,
        image: stripUnsplashUrl(sec.image),
        gallery: stripUnsplashUrls(sec.gallery),
      })),
    },
    footer: {
      ...hp.footer,
      logoUrl: (() => {
        const raw = hp.footer.logoUrl ?? "";
        if (raw.startsWith("/")) return raw;
        const cleaned = stripUnsplashUrl(raw);
        return cleaned || "/naya_logo.png";
      })(),
    },
  };
}
