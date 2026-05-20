import { fetchApi } from "@/lib/server-fetch";
import type { LegalPage } from "@/types/legal-page";

export async function getPublishedLegalPages(): Promise<LegalPage[]> {
  try {
    const res = await fetchApi("/api/legal-pages", { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { pages?: LegalPage[] };
    return (data.pages ?? []).filter((p) => p.published);
  } catch {
    return [];
  }
}

export async function getLegalPageBySlug(slug: string): Promise<LegalPage | null> {
  try {
    const res = await fetchApi(`/api/legal-pages/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { page?: LegalPage };
    return data.page ?? null;
  } catch {
    return null;
  }
}

export async function getLegalPageSlugs(): Promise<string[]> {
  const pages = await getPublishedLegalPages();
  return pages.map((p) => p.slug);
}
