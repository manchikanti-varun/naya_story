/**
 * URL embed utilities.
 * Detects YouTube, Vimeo, and Google Drive URLs and converts them to embeddable formats.
 */

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const VIMEO_REGEX =
  /(?:vimeo\.com\/)(\d+)/;

const GOOGLE_DRIVE_REGEX =
  /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;

/** Extract a Google Drive file ID from a URL */
export function extractGoogleDriveFileId(url: string): string | null {
  const match = url.match(GOOGLE_DRIVE_REGEX);
  return match?.[1] ?? null;
}

/** Convert a URL into an embeddable iframe src. Returns null if not embeddable. */
export function toEmbeddableIframeSrc(url: string): string | null {
  // YouTube
  const ytMatch = url.match(YOUTUBE_REGEX);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(VIMEO_REGEX);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Google Drive
  const driveMatch = url.match(GOOGLE_DRIVE_REGEX);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  return null;
}

/** Resolve an image embed URL (Google Drive → thumbnail) */
export function resolveImageEmbedUrl(url: string): string {
  const driveId = extractGoogleDriveFileId(url);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
  }
  return url;
}

/** Rewrite Google Drive image share links to thumbnail URLs in HTML */
export function rewriteGoogleDriveImagesInHtml(html: string): string {
  return html.replace(
    /(<img[^>]+src=")([^"]*drive\.google\.com[^"]*)(")/g,
    (_, before, url, after) => {
      return `${before}${resolveImageEmbedUrl(url)}${after}`;
    },
  );
}

/** Rewrite embedded media (Drive/YouTube/Vimeo) in HTML for proper rendering */
export function rewriteEmbeddedMediaInHtml(html: string): string {
  let result = rewriteGoogleDriveImagesInHtml(html);

  // Convert plain video URLs in src to embeddable iframes
  result = result.replace(
    /(<iframe[^>]+src=")([^"]*)(")/g,
    (_, before, url, after) => {
      const embedUrl = toEmbeddableIframeSrc(url);
      return embedUrl ? `${before}${embedUrl}${after}` : `${before}${url}${after}`;
    },
  );

  return result;
}

/** Remove consecutive duplicate rich text blocks (from paste issues) */
export function dedupeConsecutiveRichTextBlocks(html: string): string {
  // Splits HTML into top-level block elements, removes consecutive dupes
  const div = document.createElement("div");
  div.innerHTML = html;
  const children = Array.from(div.children);
  const deduped: Element[] = [];

  for (const child of children) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.outerHTML === child.outerHTML) continue;
    deduped.push(child);
  }

  return deduped.map((el) => el.outerHTML).join("");
}

/** Convert rich text HTML to plain text */
export function normalizeRichTextPlainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

/** Check if a URL is a direct video file (mp4, webm, ogg) */
export function isDirectVideoUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|ogg)$/.test(pathname);
  } catch {
    return /\.(mp4|webm|ogg)($|\?)/.test(url.toLowerCase());
  }
}

/** Detect if URL is YouTube, Vimeo, Drive, or direct video */
export function isVideoUrl(url: string): boolean {
  return !!(
    YOUTUBE_REGEX.test(url) ||
    VIMEO_REGEX.test(url) ||
    GOOGLE_DRIVE_REGEX.test(url) ||
    isDirectVideoUrl(url)
  );
}
