import type { HomepageConfig } from "@/types/homepage";
import { fetchApi } from "@/lib/server-fetch";

export type SiteSettingsPayload = {
  homepage: HomepageConfig;
  banners?: unknown;
  [key: string]: unknown;
};

export async function getSiteSettings(): Promise<{ settings: SiteSettingsPayload }> {
  const res = await fetchApi("/api/content/site");
  if (!res.ok) throw new Error(`Failed to load site settings (${res.status})`);
  return res.json() as Promise<{ settings: SiteSettingsPayload }>;
}

export async function getProductsByIds(ids: string[]): Promise<import("@/types").Product[]> {
  if (ids.length === 0) return [];
  const q = encodeURIComponent(ids.join(","));
  const res = await fetchApi(`/api/products?ids=${q}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { products: import("@/types").Product[] };
  return data.products ?? [];
}
