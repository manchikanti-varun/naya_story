/** Preset labels for product design / detail shots (admin + storefront). */
export const PRODUCT_IMAGE_LABEL_PRESETS = [
  "",
  "Hero",
  "Front",
  "Back",
  "Side",
  "Detail",
  "Fabric & texture",
  "On model",
  "Styling",
  "Print & pattern",
] as const;

export type ProductGalleryItem = {
  url: string;
  label: string;
};

export function normalizeProductCaptions(
  images: string[],
  captions?: string[] | null,
): string[] {
  const urls = images.map((s) => s.trim()).filter(Boolean);
  const caps = captions ?? [];
  return urls.map((_, i) => (caps[i] ?? "").trim());
}

export function buildProductGalleryItems(
  images: string[],
  captions?: string[] | null,
): ProductGalleryItem[] {
  const urls = images.map((s) => s.trim()).filter(Boolean);
  const caps = normalizeProductCaptions(urls, captions);
  return urls.map((url, i) => ({
    url,
    label: caps[i] || (i === 0 ? "Hero" : `View ${i + 1}`),
  }));
}

export function hasDesignGalleryLabels(captions?: string[] | null): boolean {
  return (captions ?? []).some((c) => c.trim().length > 0);
}
