import type { ReactNode } from "react";
import type { Product } from "@/types";
import { BESTSELLERS_HOMEPAGE_VISIBLE, NEWIN_HOMEPAGE_VISIBLE } from "@/lib/cms/homepage-product-limits";
import type {
  HomepageConfig,
  HomepageEditorialConfig,
  HomepageLayoutBlock,
  HomepageStorefrontBlockType,
  SectionTextColors,
} from "@/types/homepage";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeProductRail } from "@/components/home/HomeProductRail";
import { ShopByCategorySection } from "@/components/home/ShopByCategorySection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { BrandStory } from "@/components/home/BrandStory";
import { LookbookSection } from "@/components/home/LookbookSection";
import { CraftsmanshipSection } from "@/components/home/editorial/CraftsmanshipSection";
import { LuxuryPromiseSection } from "@/components/home/editorial/LuxuryPromiseSection";
import { AsSeenInSection } from "@/components/home/editorial/AsSeenInSection";
import { EditorialJournalSection } from "@/components/home/editorial/EditorialJournalSection";
import { InstagramGallerySection } from "@/components/home/editorial/InstagramGallerySection";

export type SectionRenderContext = {
  homepage: HomepageConfig;
  editorial: HomepageEditorialConfig;
  colors?: HomepageConfig["sectionTextColors"];
  bestList: Product[];
  newList: Product[];
  /** Mutable counter for alternating commerce rail spacing */
  commerceIndex: { value: number };
};

type SectionRenderer = (ctx: SectionRenderContext, block: HomepageLayoutBlock) => ReactNode;

function commerceTop(ctx: SectionRenderContext) {
  const compact = ctx.commerceIndex.value > 0;
  ctx.commerceIndex.value += 1;
  return compact;
}

const sectionRegistry: Record<HomepageStorefrontBlockType, SectionRenderer> = {
  hero: (ctx, block) => (
    <div key={block.id} className="-mt-[calc(var(--store-nav-pad)+var(--store-promo-bar-h))]">
      <HeroCarousel
        slides={ctx.homepage.carousel.slides}
        autoplayMs={ctx.homepage.carousel.autoplayMs}
        carouselStyles={ctx.homepage.carousel.styles}
        sectionText={ctx.colors?.hero}
      />
    </div>
  ),

  brandStory: (ctx, block) => (
    <BrandStory key={block.id} config={ctx.editorial.brandStory} sectionText={ctx.colors?.brandStory} />
  ),

  bestsellers: (ctx, block) => (
    <HomeProductRail
      key={block.id}
      tone="ivory"
      compactTop={commerceTop(ctx)}
      compactBottom
      title={ctx.homepage.bestsellers.title}
      subtitle={ctx.homepage.bestsellers.subtitle}
      products={ctx.bestList}
      maxVisible={BESTSELLERS_HOMEPAGE_VISIBLE}
      kicker={ctx.homepage.bestsellers.kicker}
      badge="bestseller"
      sectionText={ctx.colors?.bestsellers}
      design={ctx.homepage.bestsellers.styles}
      cta={{
        label: ctx.homepage.bestsellers.ctaLabel ?? "View all bestsellers",
        href: ctx.homepage.bestsellers.ctaHref ?? "/collections?tab=bestselling",
      }}
    />
  ),

  lookbook: (ctx, block) => (
    <LookbookSection key={block.id} config={ctx.editorial.lookbook} sectionText={ctx.colors?.lookbook} />
  ),

  newIn: (ctx, block) => (
    <HomeProductRail
      key={block.id}
      tone="mist"
      compactTop={commerceTop(ctx)}
      title={ctx.homepage.newIn.title}
      subtitle={ctx.homepage.newIn.subtitle}
      products={ctx.newList}
      maxVisible={NEWIN_HOMEPAGE_VISIBLE}
      kicker={ctx.homepage.newIn.kicker}
      badge="latest"
      sectionText={ctx.colors?.newIn}
      design={ctx.homepage.newIn.styles}
      cta={{
        label: ctx.homepage.newIn.ctaLabel,
        href: ctx.homepage.newIn.ctaHref,
      }}
    />
  ),

  craftsmanship: (ctx, block) => (
    <CraftsmanshipSection
      key={block.id}
      config={ctx.editorial.craftsmanship}
      sectionText={ctx.colors?.craftsmanship}
    />
  ),

  categories: (ctx, block) => (
    <ShopByCategorySection
      key={block.id}
      title={ctx.homepage.categories.title}
      subtitle={ctx.homepage.categories.subtitle}
      kicker={ctx.homepage.categories.kicker}
      items={ctx.homepage.categories.items}
      compactTop={commerceTop(ctx)}
      sectionText={ctx.colors?.categories}
      design={ctx.homepage.categories.styles}
      cta={{
        label: ctx.homepage.categories.ctaLabel ?? "Explore all collections",
        href: ctx.homepage.categories.ctaHref ?? "/collections",
      }}
    />
  ),

  asSeenIn: (ctx, block) => (
    <AsSeenInSection key={block.id} config={ctx.editorial.asSeenIn} sectionText={ctx.colors?.asSeenIn} />
  ),

  editorialJournal: (ctx, block) => (
    <EditorialJournalSection
      key={block.id}
      config={ctx.editorial.editorialJournal}
      sectionText={ctx.colors?.editorialJournal}
    />
  ),

  luxuryPromise: (ctx, block) => (
    <LuxuryPromiseSection
      key={block.id}
      config={ctx.editorial.luxuryPromise}
      sectionText={ctx.colors?.luxuryPromise}
    />
  ),

  instagramGallery: (ctx, block) => (
    <InstagramGallerySection
      key={block.id}
      config={ctx.editorial.instagramGallery}
      sectionText={ctx.colors?.instagramGallery}
    />
  ),

  newsletter: (ctx, block) => (
    <NewsletterSection
      key={block.id}
      title={ctx.homepage.newsletter.title}
      description={ctx.homepage.newsletter.description}
      placeholder={ctx.homepage.newsletter.placeholder}
      buttonLabel={ctx.homepage.newsletter.buttonLabel}
      compactTop={commerceTop(ctx)}
      textColors={ctx.colors?.newsletter}
      design={ctx.homepage.newsletter.styles}
      cta={{
        label: ctx.homepage.newsletter.secondaryCtaLabel ?? "Read our story",
        href: ctx.homepage.newsletter.secondaryCtaHref ?? "/our-story",
      }}
    />
  ),
};

export function renderStorefrontSection(
  block: HomepageLayoutBlock,
  ctx: SectionRenderContext,
): ReactNode {
  if (!block.enabled) return null;
  const renderer = sectionRegistry[block.type as HomepageStorefrontBlockType];
  if (!renderer) return null;
  return renderer(ctx, block);
}

export function isStorefrontSectionType(type: string): type is HomepageStorefrontBlockType {
  return type in sectionRegistry;
}
