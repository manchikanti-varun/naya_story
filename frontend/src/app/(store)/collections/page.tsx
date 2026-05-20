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
    <div className="min-h-screen bg-[#f1ece5]">
      <div className="lux-shell py-24">
        <p className="lux-kicker">Collections</p>
        <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lux bg-ivory-soft" />
          ))}
        </div>
      </div>
    </div>
  );
}

