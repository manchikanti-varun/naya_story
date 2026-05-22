/** Returns true when URL is an Unsplash CDN image (demo stock photos). */
export function isUnsplashUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  return /images\.unsplash\.com/i.test(url.trim());
}

/** Clears Unsplash URLs; leaves Cloudinary, local, and other hosts unchanged. */
export function stripUnsplashUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  return isUnsplashUrl(trimmed) ? "" : trimmed;
}

export function stripUnsplashUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map((u) => stripUnsplashUrl(u)).filter(Boolean);
}

/** Strip Unsplash URLs from product documents (API + DB migration). */
export function sanitizeProductMedia(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...doc };
  if ("images" in out) out.images = stripUnsplashUrls(out.images);
  if ("hoverImage" in out) out.hoverImage = stripUnsplashUrl(out.hoverImage);
  if ("newInHoverImage" in out) out.newInHoverImage = stripUnsplashUrl(out.newInHoverImage);
  return out;
}
