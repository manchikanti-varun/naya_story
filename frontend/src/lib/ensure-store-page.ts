import { redirect } from "next/navigation";
import { getSiteSettings } from "@/lib/server-content";
import { isStorePageEnabled, type StorePageKey } from "@/lib/store-page-flags";

/** Redirects to home when an admin has disabled a storefront route. */
export async function ensureStorePageEnabled(page: StorePageKey): Promise<void> {
  const { settings } = await getSiteSettings();
  if (!isStorePageEnabled(settings.homepage, page)) {
    redirect("/");
  }
}
