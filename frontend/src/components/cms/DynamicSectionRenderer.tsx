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
