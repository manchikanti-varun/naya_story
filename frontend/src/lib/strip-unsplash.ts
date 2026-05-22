export function isUnsplashUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  return /images\.unsplash\.com/i.test(url.trim());
}

export function stripUnsplashUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  return isUnsplashUrl(trimmed) ? "" : trimmed;
}

export function stripUnsplashUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map((u) => stripUnsplashUrl(u)).filter(Boolean);
}
