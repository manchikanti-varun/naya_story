/**
 * Primary storefront header navigation — single source for desktop nav + admin read-only summary.
 * (Mobile menu can import the same rows.)
 */
export type StoreNavMatchContext = {
  pathname: string;
  collection: string | null;
  hash: string;
};

export type StoreNavRow = {
  label: string;
  href: string;
  match: (ctx: StoreNavMatchContext) => boolean;
};

export const STORE_PRIMARY_NAV: StoreNavRow[] = [
  {
    label: "Home",
    href: "/",
    match: ({ pathname, hash }) => pathname === "/" && hash !== "story",
  },
  {
    label: "New In",
    href: "/new-in",
    match: ({ pathname }) => pathname.startsWith("/new-in"),
  },
  {
    label: "Collections",
    href: "/collections",
    match: ({ pathname, collection }) =>
      pathname.startsWith("/collections") && collection !== "new-arrivals",
  },
  {
    label: "Our Story",
    href: "/our-story",
    match: ({ pathname }) => pathname.startsWith("/our-story"),
  },
];

export function storeNavRowsForAdmin(): { label: string; href: string }[] {
  return STORE_PRIMARY_NAV.map(({ label, href }) => ({ label, href }));
}
