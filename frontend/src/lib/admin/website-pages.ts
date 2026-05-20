/** Admin Website → Pages tab routes */
export const WEBSITE_PAGES_BASE = "/admin/website/pages";

export type WebsitePagesTab =
  | "homepage"
  | "collections-browse"
  | "new-in"
  | "our-story";

export function websitePagesUrl(
  tab: WebsitePagesTab = "homepage",
  params?: { edit?: string },
): string {
  const qs = new URLSearchParams({ tab });
  if (params?.edit) qs.set("edit", params.edit);
  return `${WEBSITE_PAGES_BASE}?${qs.toString()}`;
}

/** @deprecated Use websitePagesUrl("homepage", { edit }) */
export function legacyHomepageRedirectUrl(edit?: string): string {
  return websitePagesUrl("homepage", edit ? { edit } : undefined);
}

export function normalizePagesTab(raw: string | null): WebsitePagesTab {
  if (raw === "collections" || raw === "collections-browse") return "collections-browse";
  if (raw === "new-in") return "new-in";
  if (raw === "our-story") return "our-story";
  return "homepage";
}
