import { STORE_LOGO_PUBLIC_PATH } from "@/lib/constants";
import { stripUnsplashUrl } from "@/lib/strip-unsplash";

/** True when a string is safe to pass to `<Image src>` or `<img src>`. */
export function isValidImageSrc(src: string | null | undefined): src is string {
  return Boolean(stripUnsplashUrl(src));
}

/** Use with `next/image` only for hosts allowed in next.config `images.remotePatterns`. */
export function isNextImageSrc(src: string | null | undefined): src is string {
  if (!isValidImageSrc(src)) return false;
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return host === "res.cloudinary.com" || host.endsWith(".cloudinary.com");
  } catch {
    return false;
  }
}
/** Cache-bust query for local `public/` assets (safe on client and server). */
export function bustPublicAsset(path: string, rev?: string): string {
  if (!path.startsWith("/")) return path;
  const v = rev ?? (process.env.NEXT_PUBLIC_LOGO_REV?.trim() || "1");
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${encodeURIComponent(v)}`;
}

/** Logo path for header/footer — never returns an empty string. */
export function resolveStoreLogoSrc(
  logoUrl: string | null | undefined,
  rev?: string,
  fallback: string = STORE_LOGO_PUBLIC_PATH,
): string {
  const raw = logoUrl?.trim();
  const path =
    raw && (raw.startsWith("/") || raw.startsWith("http")) ? raw : fallback;
  if (path.startsWith("/")) return bustPublicAsset(path, rev);
  return path;
}
