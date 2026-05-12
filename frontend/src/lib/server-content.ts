import type { HomepageConfig } from "@/types/homepage";

const apiOrigin =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export type SiteSettingsPayload = {
  homepage: HomepageConfig;
  banners?: unknown;
  [key: string]: unknown;
};

export async function getSiteSettings(): Promise<{ settings: SiteSettingsPayload }> {
  const res = await fetch(`${apiOrigin}/api/content/site`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load site settings (${res.status})`);
  return res.json() as Promise<{ settings: SiteSettingsPayload }>;
}

export async function getProductsByIds(ids: string[]): Promise<import("@/types").Product[]> {
  if (ids.length === 0) return [];
  const q = encodeURIComponent(ids.join(","));
  const res = await fetch(`${apiOrigin}/api/products?ids=${q}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { products: import("@/types").Product[] };
  return data.products ?? [];
}
