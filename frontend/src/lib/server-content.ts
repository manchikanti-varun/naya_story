import type { HomepageConfig } from "@/types/homepage";
import { fetchApi } from "@/lib/server-fetch";

export type SiteSettingsPayload = {
  homepage: HomepageConfig;
  banners?: unknown;
  [key: string]: unknown;
};

/** Default empty settings used when the API is unreachable (e.g. during static build). */
function fallbackSettings(): { settings: SiteSettingsPayload } {
  return {
    settings: {
      homepage: {} as HomepageConfig,
    },
  };
}

export async function getSiteSettings(): Promise<{ settings: SiteSettingsPayload }> {
  try {
    const res = await fetchApi("/api/content/site");
    if (!res.ok) {
      // During build, the API isn't running — return fallback instead of crashing
      if (process.env.NODE_ENV === "production" && !res.ok) {
        console.warn(`[getSiteSettings] API returned ${res.status}, using fallback`);
        return fallbackSettings();
      }
      throw new Error(`Failed to load site settings (${res.status})`);
    }
    return res.json() as Promise<{ settings: SiteSettingsPayload }>;
  } catch (err) {
    // Connection refused during build (API not running) — graceful fallback
    if (
      err instanceof TypeError &&
      (String(err.message).includes("fetch failed") || String((err as { cause?: { code?: string } }).cause?.code).includes("ECONNREFUSED"))
    ) {
      console.warn("[getSiteSettings] API unreachable, using fallback (expected during build)");
      return fallbackSettings();
    }
    throw err;
  }
}

export async function getProductsByIds(ids: string[]): Promise<import("@/types").Product[]> {
  if (ids.length === 0) return [];
  try {
    const q = encodeURIComponent(ids.join(","));
    const res = await fetchApi(`/api/products?ids=${q}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { products: import("@/types").Product[] };
    return data.products ?? [];
  } catch {
    return [];
  }
}

export async function getBestsellerProducts(limit = 8): Promise<import("@/types").Product[]> {
  try {
    const res = await fetchApi(`/api/products?bestseller=true&limit=${limit}&sort=popular`);
    if (!res.ok) return [];
    const data = (await res.json()) as { products: import("@/types").Product[] };
    return data.products ?? [];
  } catch {
    return [];
  }
}

export async function getNewInProducts(limit = 8): Promise<import("@/types").Product[]> {
  try {
    const res = await fetchApi(`/api/products?newIn=true&limit=${limit}&sort=new_in`);
    if (!res.ok) return [];
    const data = (await res.json()) as { products: import("@/types").Product[] };
    return data.products ?? [];
  } catch {
    return [];
  }
}
