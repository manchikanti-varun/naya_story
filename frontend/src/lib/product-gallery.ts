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

/** Image index where the below-fold “Design & construction” grid starts. */
export const PDP_DETAIL_START_INDEX = 2;

export type PdpGallerySplit = {
  all: string[];
  hero?: string;
  hoverOverlay?: string;
  detail: string[];
};

/** PDP: 1 = hero, 2 = hover on hero, 3+ = detail section only (no duplicates). */
export function splitPdpGallery(images: string[]): PdpGallerySplit {
  const all = images.map((s) => s.trim()).filter(Boolean);
  return {
    all,
    hero: all[0],
    hoverOverlay: all[1],
    detail: all.slice(PDP_DETAIL_START_INDEX),
  };
}

export function captionsForDetailGallery(
  captions: string[] | null | undefined,
  detailLength: number,
): string[] {
  const caps = captions ?? [];
  return caps.slice(PDP_DETAIL_START_INDEX, PDP_DETAIL_START_INDEX + detailLength);
}
