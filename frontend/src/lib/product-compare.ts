const STORAGE_KEY = "naya_compare_slugs";
export const MAX_COMPARE_ITEMS = 4;

export function readCompareSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string").slice(0, MAX_COMPARE_ITEMS);
  } catch {
    return [];
  }
}

export function writeCompareSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;
  const unique = [...new Set(slugs)].slice(0, MAX_COMPARE_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  window.dispatchEvent(new CustomEvent("naya-compare-change"));
}

export function toggleCompareSlug(slug: string): { slugs: string[]; added: boolean } {
  const current = readCompareSlugs();
  const idx = current.indexOf(slug);
  if (idx >= 0) {
    const next = current.filter((s) => s !== slug);
    writeCompareSlugs(next);
    return { slugs: next, added: false };
  }
  if (current.length >= MAX_COMPARE_ITEMS) {
    const next = [...current.slice(1), slug];
    writeCompareSlugs(next);
    return { slugs: next, added: true };
  }
  const next = [...current, slug];
  writeCompareSlugs(next);
  return { slugs: next, added: true };
}

export function isInCompareList(slug: string): boolean {
  return readCompareSlugs().includes(slug);
}
