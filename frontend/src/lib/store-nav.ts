/**
 * Primary storefront header navigation — single source for desktop nav + mobile menu.
 */
import type { StorePageFlags } from "@/lib/store-page-flags";

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

const ALL_NAV_ROWS: StoreNavRow[] = [
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

function rowVisible(href: string, flags: StorePageFlags): boolean {
  if (href === "/new-in") return flags.newIn;
  if (href === "/collections") return flags.collections;
  if (href === "/our-story") return flags.ourStory;
  return true;
}

/** Build primary nav respecting admin page publish toggles. */
export function buildStorePrimaryNav(flags?: Partial<StorePageFlags>): StoreNavRow[] {
  const resolved: StorePageFlags = {
    collections: flags?.collections !== false,
    newIn: flags?.newIn !== false,
    ourStory: flags?.ourStory !== false,
  };
  return ALL_NAV_ROWS.filter((row) => rowVisible(row.href, resolved));
}

/** Default nav (all store pages enabled). */
export const STORE_PRIMARY_NAV: StoreNavRow[] = buildStorePrimaryNav();

export function storeNavRowsForAdmin(): { label: string; href: string }[] {
  return ALL_NAV_ROWS.map(({ label, href }) => ({ label, href }));
}
