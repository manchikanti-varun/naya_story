import { Suspense } from "react";
import { NewInEditorial } from "@/components/shop/NewInEditorial";
import { StoreBrowseSkeleton } from "@/components/shop/StoreBrowseUI";
import { ensureStorePageEnabled } from "@/lib/ensure-store-page";

export default async function NewInPage() {
  await ensureStorePageEnabled("newIn");
  return (
    <Suspense fallback={<StoreBrowseSkeleton kicker="Latest arrivals" showFilterRow={false} />}>
      <NewInEditorial />
    </Suspense>
  );
}
