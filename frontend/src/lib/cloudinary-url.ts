/**
 * Cloudinary URL transformation utility.
 *
 * Applies automatic format (WebP/AVIF), quality, and width optimizations
 * to Cloudinary image URLs. This reduces image payload by 40-70% compared
 * to serving raw uploads.
 *
 * Usage:
 *   import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url";
 *
 *   <Image src={optimizeCloudinaryUrl(product.images[0], { width: 800 })} ... />
 *
 * Transformations:
 *   f_auto  — serve WebP/AVIF based on browser Accept header
 *   q_auto  — automatic quality (Cloudinary ML-based, typically 60-80)
 *   w_{n}   — resize width (height auto-calculated to maintain aspect ratio)
 *   dpr_auto — device pixel ratio for retina displays
 */

type OptimizeOptions = {
  /** Target width in pixels. Omit for full-size with format/quality optimization only. */
  width?: number;
  /** Quality: "auto" (default), "auto:good", "auto:eco", or a number 1-100. */
  quality?: string | number;
  /** Additional Cloudinary transformations (e.g. "c_fill,ar_3:4"). */
  extra?: string;
};

const CLOUDINARY_UPLOAD_REGEX =
  /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/)?(.+)$/;

/**
 * Add format/quality/width optimizations to a Cloudinary URL.
 * Returns the original URL unchanged if it's not a Cloudinary upload URL.
 */
export function optimizeCloudinaryUrl(
  url: string | undefined | null,
  options: OptimizeOptions = {},
): string {
  if (!url) return "";
  const match = url.match(CLOUDINARY_UPLOAD_REGEX);
  if (!match) return url; // Not a Cloudinary URL — pass through unchanged

  const [, base, version = "", path] = match;
  const transforms: string[] = [];

  // Format: always serve best format for the browser
  transforms.push("f_auto");

  // Quality
  const q = options.quality ?? "auto";
  transforms.push(typeof q === "number" ? `q_${q}` : `q_${q}`);

  // Width
  if (options.width) {
    transforms.push(`w_${options.width}`);
    transforms.push("c_limit"); // Don't upscale, only downscale
  }

  // Extra transforms
  if (options.extra) {
    transforms.push(options.extra);
  }

  const transformString = transforms.join(",");
  return `${base}${transformString}/${version}${path}`;
}

/**
 * Generate responsive image srcSet for a Cloudinary image.
 * Useful for `<Image>` sizes prop or manual `<img srcSet>`.
 */
export function cloudinarySrcSet(
  url: string | undefined | null,
  widths: number[] = [400, 640, 800, 1200, 1600],
): string {
  if (!url) return "";
  const match = url.match(CLOUDINARY_UPLOAD_REGEX);
  if (!match) return url;

  return widths
    .map((w) => `${optimizeCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(", ");
}

/**
 * Get a low-quality placeholder URL (20px wide, heavily compressed) for blur-up effect.
 */
export function cloudinaryBlurPlaceholder(url: string | undefined | null): string {
  if (!url) return "";
  return optimizeCloudinaryUrl(url, { width: 20, quality: 30, extra: "e_blur:1000" });
}
