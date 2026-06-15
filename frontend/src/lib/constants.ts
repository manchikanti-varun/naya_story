/** Public storefront + metadata brand name */
export const SITE_NAME = "Naya Story";

/** Default meta / OG-style description (storefront) */
export const SITE_DESCRIPTION =
  "Naya Story — luxury women’s fashion. Timeless silhouettes, editorial calm, and pieces made to live in.";

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
    image: "",
  },
  {
    slug: "summer-edit",
    title: "Summer Edit",
    subtitle: "Lightness & ease",
    image: "",
  },
  {
    slug: "elevated-essentials",
    title: "Elevated Essentials",
    subtitle: "The refined everyday",
    image: "",
  },
  {
    slug: "everyday-luxury",
    title: "Everyday Luxury",
    subtitle: "Quiet confidence",
    image: "",
  },
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "return_requested",
  "return_approved",
  "refunded",
] as const;
