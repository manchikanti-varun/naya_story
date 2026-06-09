import type { MetadataRoute } from "next";
import { fetchApi } from "@/lib/server-fetch";
import { getSiteSettings } from "@/lib/server-content";
import { getSiteUrl } from "@/lib/site-url";
import { storePageFlagsFromHomepage } from "@/lib/store-page-flags";
import type { LegalPage } from "@/types/legal-page";
import { legalPageHref } from "@/types/legal-page";

export const revalidate = 3600;

const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.9 },
  { path: "/new-in", changeFrequency: "daily", priority: 0.9 },
  { path: "/our-story", changeFrequency: "monthly", priority: 0.7 },
  { path: "/compare", changeFrequency: "weekly", priority: 0.5 },
  { path: "/login", changeFrequency: "monthly", priority: 0.3 },
  { path: "/register", changeFrequency: "monthly", priority: 0.3 },
];

type ProductEntry = {
  slug: string;
  updatedAt?: string;
};

async function fetchAllProducts(): Promise<ProductEntry[]> {
  const products: ProductEntry[] = [];
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
      products?: Array<{ slug?: string; updatedAt?: string }>;
      pages?: number;
    };
    const list = data.products ?? [];
    if (list.length === 0) break;

    for (const p of list) {
      const s = p.slug?.trim();
      if (s) {
        products.push({ slug: s, updatedAt: p.updatedAt });
      }
    }

    const pages = Math.max(Number(data.pages) || 1, 1);
    if (page >= pages) break;
    page += 1;
  }

  return products;
}

async function fetchLegalPages(): Promise<
  { path: string; updatedAt?: string }[]
> {
  try {
    const res = await fetchApi("/api/legal-pages");
    if (!res.ok) return [];
    const data = (await res.json()) as { pages?: LegalPage[] };
    return (data.pages ?? [])
      .filter((p) => p.published && p.slug?.trim())
      .map((p) => ({
        path: legalPageHref(p.slug),
        updatedAt: (p as { updatedAt?: string }).updatedAt,
      }));
  } catch {
    return [];
  }
}

async function fetchCategories(): Promise<string[]> {
  try {
    const res = await fetchApi("/api/products?limit=1");
    if (!res.ok) return [];
    const data = (await res.json()) as { categories?: string[] };
    return (data.categories ?? []).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  // Determine which store pages are enabled
  let storeFlags = { collections: true, newIn: true, ourStory: true };
  try {
    const { settings } = await getSiteSettings();
    storeFlags = storePageFlagsFromHomepage(settings.homepage);
  } catch {
    /* API unavailable — include all store routes */
  }

  // Static pages
  const staticPaths = STATIC_PATHS.filter(({ path }) => {
    if (path === "/collections") return storeFlags.collections;
    if (path === "/new-in") return storeFlags.newIn;
    if (path === "/our-story") return storeFlags.ourStory;
    return true;
  });

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(
    ({ path, changeFrequency, priority }) => ({
      url: path === "" ? base : `${base}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  // Product pages (with per-product lastModified when available)
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchAllProducts();
    productEntries = products.map((p) => ({
      url: `${base}/products/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // API unavailable — static URLs still published.
  }

  // Legal / policy pages
  let legalEntries: MetadataRoute.Sitemap = [];
  try {
    const pages = await fetchLegalPages();
    legalEntries = pages.map((p) => ({
      url: `${base}${p.path}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    }));
  } catch {
    /* ignore */
  }

  // Collection category pages (if collections page uses ?category= query)
  let categoryEntries: MetadataRoute.Sitemap = [];
  if (storeFlags.collections) {
    try {
      const categories = await fetchCategories();
      categoryEntries = categories.map((cat) => ({
        url: `${base}/collections?category=${encodeURIComponent(cat)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } catch {
      /* ignore */
    }
  }

  return [
    ...staticEntries,
    ...categoryEntries,
    ...legalEntries,
    ...productEntries,
  ];
}
