import type { Metadata } from "next";
import { Suspense } from "react";
import { NewInEditorial } from "@/components/shop/NewInEditorial";
import { StoreBrowseSkeleton } from "@/components/shop/StoreBrowseUI";
import { ensureStorePageEnabled } from "@/lib/ensure-store-page";
import { SITE_NAME } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "New In",
  description: `Discover the latest arrivals at ${SITE_NAME}. Fresh silhouettes and limited-edition pieces, updated weekly.`,
  alternates: { canonical: `${getSiteUrl()}/new-in` },
  openGraph: {
    title: `New In · ${SITE_NAME}`,
    description: `The latest luxury women's fashion — just landed.`,
    url: `${getSiteUrl()}/new-in`,
  },
};

export default async function NewInPage() {
  await ensureStorePageEnabled("newIn");
  return (
    <Suspense fallback={<StoreBrowseSkeleton kicker="Latest arrivals" showFilterRow={false} />}>
      <NewInEditorial />
    </Suspense>
  );
}
