import type { HeroSlide, SectionDesign, SectionTextColors } from "@/types/homepage";

export type EffectiveHeroSlideStyle = {
  styles?: SectionDesign;
  textColors?: SectionTextColors;
};

/** Slides in CMS carousel order (by `order`, then stable id). */
export function sortHeroSlides(slides: HeroSlide[]): HeroSlide[] {
  return [...slides].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/**
 * Resolved per-slide design when `matchPreviousSlideStyles` is set.
 * Walks backward in carousel order; slide 1 never inherits.
 */
export function getEffectiveHeroSlideStyle(
  slides: HeroSlide[],
  slideId: string,
): EffectiveHeroSlideStyle {
  const sorted = sortHeroSlides(slides);
  const index = sorted.findIndex((s) => s.id === slideId);
  if (index < 0) return {};
  return getEffectiveHeroSlideStyleAt(sorted, index);
}

function getEffectiveHeroSlideStyleAt(
  sorted: HeroSlide[],
  index: number,
): EffectiveHeroSlideStyle {
  const slide = sorted[index];
  if (!slide) return {};
  if (slide.matchPreviousSlideStyles && index > 0) {
    return getEffectiveHeroSlideStyleAt(sorted, index - 1);
  }
  return {
    styles: slide.styles,
    textColors: slide.textColors,
  };
}

export function cloneHeroSlideStyle(source: EffectiveHeroSlideStyle): EffectiveHeroSlideStyle {
  return {
    styles: source.styles ? { ...source.styles } : undefined,
    textColors: source.textColors ? { ...source.textColors } : undefined,
  };
}
