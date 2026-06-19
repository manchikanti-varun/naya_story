import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionsExplorer } from "@/components/shop/CollectionsExplorer";
import { StoreBrowseSkeleton } from "@/components/shop/StoreBrowseUI";
import { ensureStorePageEnabled } from "@/lib/ensure-store-page";
import { SITE_NAME } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

/** ISR: regenerate collections page every 60 seconds. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Collections",
  description: `Browse the full ${SITE_NAME} collection. Filter by category, size, colour, and price to find your perfect piece.`,
  alternates: { canonical: `${getSiteUrl()}/collections` },
  openGraph: {
    title: `Collections · ${SITE_NAME}`,
    description: `Explore luxury women's fashion — curated categories, new arrivals, and bestsellers.`,
    url: `${getSiteUrl()}/collections`,
  },
};

export default async function CollectionsPage() {
  await ensureStorePageEnabled("collections");
  return (
    <Suspense fallback={<StoreBrowseSkeleton kicker="Collections" />}>
      <CollectionsExplorer />
    </Suspense>
  );
}

