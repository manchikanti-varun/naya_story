export const SITE_NAME = "Naya Studio";

/**
 * Logo file lives in `public/` (e.g. `public/naya_logo.png`). If you replace the file but keep the same path,
 * browsers and Next.js image optimization cache the old image. Bump `NEXT_PUBLIC_LOGO_REV` in `.env.local`
 * (e.g. `2`, `3`) after each replacement so everyone sees the new asset.
 */
export const STORE_LOGO_PUBLIC_PATH = "/naya_logo.png";

export function bustLocalPublicAsset(path: string): string {
  if (!path.startsWith("/")) return path;
  const rev = process.env.NEXT_PUBLIC_LOGO_REV?.trim() || "1";
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${encodeURIComponent(rev)}`;
}

export const COLLECTIONS = [
  {
    slug: "new-arrivals",
    title: "New Arrivals",
    subtitle: "Fresh silhouettes",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80",
  },
  {
    slug: "summer-edit",
    title: "Summer Edit",
    subtitle: "Lightness & ease",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80",
  },
  {
    slug: "elevated-essentials",
    title: "Elevated Essentials",
    subtitle: "The refined everyday",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
  },
  {
    slug: "everyday-luxury",
    title: "Everyday Luxury",
    subtitle: "Quiet confidence",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80",
  },
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
