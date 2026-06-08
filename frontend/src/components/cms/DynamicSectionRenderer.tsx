"use client";

import { useMemo } from "react";
import type { Product } from "@/types";
import type { HomepageConfig, HomepageLayoutBlock } from "@/types/homepage";
import {
  buildStorefrontRenderBlocks,
  resolveHomepageEditorial,
} from "@/lib/cms/homepage-render-blocks";
import { renderStorefrontSection } from "@/lib/cms/section-registry";

export type DynamicSectionRendererProps = {
  homepage: HomepageConfig;
  products: Product[];
  blocks?: HomepageLayoutBlock[];
};

export function DynamicSectionRenderer({
  homepage,
  products,
  blocks: blocksProp,
}: DynamicSectionRendererProps) {
  const editorial = resolveHomepageEditorial(homepage);
  const blocks = blocksProp ?? buildStorefrontRenderBlocks(homepage);
  const colors = homepage.sectionTextColors;

  // Products are pre-fetched by flag: bestsellers first, then new-in
  // Split them based on their flags
  const bestList = useMemo(
    () => products.filter((p) => p.bestseller),
    [products],
  );

  const newList = useMemo(
    () => products.filter((p) => p.newIn),
    [products],
  );

  const commerceIndex = { value: 0 };
  const ctx = {
    homepage,
    editorial,
    colors,
    bestList,
    newList,
    commerceIndex,
  };

  return <>{blocks.map((block) => renderStorefrontSection(block, ctx))}</>;
}
