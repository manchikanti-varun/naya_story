import { Suspense } from "react";
import { CollectionsExplorer } from "@/components/shop/CollectionsExplorer";
import { StoreBrowseSkeleton } from "@/components/shop/StoreBrowseUI";
import { ensureStorePageEnabled } from "@/lib/ensure-store-page";

export default async function CollectionsPage() {
  await ensureStorePageEnabled("collections");
  return (
    <Suspense fallback={<StoreBrowseSkeleton kicker="Collections" />}>
      <CollectionsExplorer />
    </Suspense>
  );
}

