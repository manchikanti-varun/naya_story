/**
 * Server-safe rich text utilities for processing stored HTML before rendering.
 * These don't use `document` so they work in Next.js SSR / RSC.
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
  const ytMatch = url.match(YOUTUBE_REGEX);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  const vimeoMatch = url.match(VIMEO_REGEX);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  const driveMatch = url.match(GOOGLE_DRIVE_REGEX);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

  return null;
}

/** Resolve an image embed URL (Google Drive → thumbnail) */
export function resolveImageEmbedUrl(url: string): string {
  const driveId = extractGoogleDriveFileId(url);
  if (driveId) return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
  return url;
}

/** Rewrite Google Drive image share links to thumbnail URLs in HTML */
export function rewriteGoogleDriveImagesInHtml(html: string): string {
  return html.replace(
    /(<img[^>]+src=")([^"]*drive\.google\.com[^"]*)(")/g,
    (_, before, url, after) => `${before}${resolveImageEmbedUrl(url)}${after}`,
  );
}

/** Rewrite embedded media (Drive/YouTube/Vimeo) in HTML for proper rendering */
export function rewriteEmbeddedMediaInHtml(html: string): string {
  let result = rewriteGoogleDriveImagesInHtml(html);

  // Convert plain video URLs in iframe src to embeddable URLs
  result = result.replace(
    /(<iframe[^>]+src=")([^"]*)(")/g,
    (_, before, url, after) => {
      const embedUrl = toEmbeddableIframeSrc(url);
      return embedUrl ? `${before}${embedUrl}${after}` : `${before}${url}${after}`;
    },
  );

  return result;
}

/** Convert rich text HTML to plain text (server-safe using regex) */
export function normalizeRichTextPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Check if content is HTML (has tags) */
export function isHtmlContent(body: string): boolean {
  return /<[a-z][\s\S]*>/i.test(body);
}
