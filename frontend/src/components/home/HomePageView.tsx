"use client";

import type { Product } from "@/types";
import type { HomepageConfig } from "@/types/homepage";
import { DynamicSectionRenderer } from "@/components/cms/DynamicSectionRenderer";

type Props = {
  homepage: HomepageConfig;
  products: Product[];
};

/** Homepage storefront — all sections rendered from CMS via {@link DynamicSectionRenderer}. */
export function HomePageView({ homepage, products }: Props) {
  return <DynamicSectionRenderer homepage={homepage} products={products} />;
}
