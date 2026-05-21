import type { MetadataRoute } from "next";
import { fetchApi } from "@/lib/server-fetch";
import { getSiteSettings } from "@/lib/server-content";
import { getSiteUrl } from "@/lib/site-url";
import { storePageFlagsFromHomepage } from "@/lib/store-page-flags";
import type { LegalPage } from "@/types/legal-page";
import { legalPageHref } from "@/types/legal-page";

export const revalidate = 3600;

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] =
  [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/collections", changeFrequency: "weekly", priority: 0.9 },
    { path: "/new-in", changeFrequency: "daily", priority: 0.9 },
    { path: "/our-story", changeFrequency: "monthly", priority: 0.7 },
    { path: "/compare", changeFrequency: "weekly", priority: 0.5 },
    { path: "/login", changeFrequency: "monthly", priority: 0.3 },
    { path: "/register", changeFrequency: "monthly", priority: 0.3 },
  ];

async function fetchAllProductSlugs(): Promise<string[]> {
  const slugs = new Set<string>();
  const limit = 500;
  const maxPages = 40;
  let page = 1;

  while (page <= maxPages) {
    let res: Response;
    try {
      res = await fetchApi(`/api/products?limit=${limit}&page=${page}`);
    } catch {
      break;
    }
    if (!res.ok) break;

    const data = (await res.json()) as {
      products?: Array<{ slug?: string }>;
      pages?: number;
    };
    const list = data.products ?? [];
    if (list.length === 0) break;
    for (const p of list) {
      const s = p.slug?.trim();
      if (s) slugs.add(s);
    }
    const pages = Math.max(Number(data.pages) || 1, 1);
    if (page >= pages) break;
    page += 1;
  }

  return [...slugs];
}

async function fetchLegalPagePaths(): Promise<string[]> {
  try {
    const res = await fetchApi("/api/legal-pages");
    if (!res.ok) return [];
    const data = (await res.json()) as { pages?: LegalPage[] };
    return (data.pages ?? [])
      .filter((p) => p.published && p.slug?.trim())
      .map((p) => legalPageHref(p.slug));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  let storeFlags = { collections: true, newIn: true, ourStory: true };
  try {
    const { settings } = await getSiteSettings();
    storeFlags = storePageFlagsFromHomepage(settings.homepage);
  } catch {
    /* API unavailable — include all store routes */
  }

  const staticPaths = STATIC_PATHS.filter(({ path }) => {
    if (path === "/collections") return storeFlags.collections;
    if (path === "/new-in") return storeFlags.newIn;
    if (path === "/our-story") return storeFlags.ourStory;
    return true;
  });

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(
    ({ path, changeFrequency, priority }) => ({
      url: path === "" ? base : `${base}${path}`,
      lastModified,
      changeFrequency,
      priority,
    }),
  );

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await fetchAllProductSlugs();
    productEntries = slugs.map((slug) => ({
      url: `${base}/products/${encodeURIComponent(slug)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // API unavailable at build/runtime — static URLs still published.
  }

  let legalEntries: MetadataRoute.Sitemap = [];
  try {
    const paths = await fetchLegalPagePaths();
    legalEntries = paths.map((path) => ({
      url: `${base}${path}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    }));
  } catch {
    /* ignore */
  }

  return [...staticEntries, ...legalEntries, ...productEntries];
}
