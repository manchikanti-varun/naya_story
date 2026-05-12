"use client";

import { useMemo } from "react";
import type { Product } from "@/types";
import type { HomepageConfig } from "@/types/homepage";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeProductRail } from "@/components/home/HomeProductRail";
import { ShopByCategorySection } from "@/components/home/ShopByCategorySection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";

type Props = {
  homepage: HomepageConfig;
  products: Product[];
};

export function HomePageView({ homepage, products }: Props) {
  const byId = useMemo(
    () => new Map(products.map((p) => [p._id, p] as const)),
    [products],
  );

  const bestList = useMemo(
    () =>
      homepage.bestsellers.productIds
        .map((id) => byId.get(id))
        .filter((p): p is Product => Boolean(p)),
    [byId, homepage.bestsellers.productIds],
  );

  const newList = useMemo(
    () =>
      homepage.newIn.productIds
        .map((id) => byId.get(id))
        .filter((p): p is Product => Boolean(p)),
    [byId, homepage.newIn.productIds],
  );

  const sections = [...homepage.sectionsOrder]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="-mt-[calc(var(--store-nav-pad)+var(--store-promo-bar-h))]">
        <HeroCarousel
          slides={homepage.carousel.slides}
          autoplayMs={homepage.carousel.autoplayMs}
        />
      </div>

      {sections.map((s, idx) => {
        const compactTop = idx > 0;
        if (
          s.id === "bestsellers" &&
          s.enabled &&
          homepage.bestsellers.enabled !== false
        ) {
          return (
            <HomeProductRail
              key="bestsellers"
              tone="ivory"
              compactTop={compactTop}
              compactBottom
              title={homepage.bestsellers.title}
              subtitle={homepage.bestsellers.subtitle}
              products={bestList}
              badge="bestseller"
              cta={{
                label: "View all bestsellers",
                href: "/collections?tab=bestselling",
              }}
            />
          );
        }
        if (s.id === "newIn" && s.enabled && homepage.newIn.enabled !== false) {
          return (
            <HomeProductRail
              key="newIn"
              tone="mist"
              compactTop
              title={homepage.newIn.title}
              subtitle={homepage.newIn.subtitle}
              products={newList}
              badge="latest"
              cta={{
                label: homepage.newIn.ctaLabel,
                href: homepage.newIn.ctaHref,
              }}
            />
          );
        }
        if (
          s.id === "categories" &&
          s.enabled &&
          homepage.categories.enabled !== false
        ) {
          return (
            <ShopByCategorySection
              key="categories"
              title={homepage.categories.title}
              subtitle={homepage.categories.subtitle}
              items={homepage.categories.items}
              compactTop={compactTop}
              cta={{
                label: "Explore all collections",
                href: "/collections",
              }}
            />
          );
        }
        if (
          s.id === "newsletter" &&
          s.enabled &&
          homepage.newsletter.enabled !== false
        ) {
          return (
            <NewsletterSection
              key="newsletter"
              title={homepage.newsletter.title}
              description={homepage.newsletter.description}
              placeholder={homepage.newsletter.placeholder}
              buttonLabel={homepage.newsletter.buttonLabel}
              compactTop={compactTop}
              cta={{
                label: "Read our story",
                href: "/our-story",
              }}
            />
          );
        }
        return null;
      })}
    </>
  );
}
