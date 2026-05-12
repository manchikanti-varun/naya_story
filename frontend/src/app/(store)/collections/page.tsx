import { Suspense } from "react";
import { CollectionsExplorer } from "@/components/shop/CollectionsExplorer";

export default function CollectionsPage() {
  return (
    <Suspense fallback={<CollectionsFallback />}>
      <CollectionsExplorer />
    </Suspense>
  );
}

function CollectionsFallback() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10">
      <p className="font-sans text-sm text-ink-muted">Opening the rails…</p>
    </div>
  );
}
