import { adminNavGroups, flattenNavItemsForBreadcrumbs, isNavActive } from "@/lib/admin/nav-config";

export type AdminBreadcrumb = { label: string; href?: string };

const LABEL_OVERRIDES: Record<string, string> = {
  admin: "Dashboard",
  website: "Website",
  homepage: "Homepage",
  pages: "Pages",
  content: "Website",
  storefront: "Website",
  catalog: "Products",
  products: "Products",
  orders: "Orders",
  customers: "Customers",
  marketing: "Marketing",
  media: "Media library",
  analytics: "Analytics",
  system: "System",
  "announcement-bar": "Announcement bar",
  theme: "Theme Studio",
  inventory: "Inventory",
  settings: "Settings",
  shipping: "Fulfillment",
  tracking: "Order tracking",
  returns: "Returns",
  roles: "Roles & permissions",
  segments: "Segments",
  campaigns: "Campaigns",
};

function titleCase(slug: string) {
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Build breadcrumbs from pathname + nav registry. */
export function adminBreadcrumbs(pathname: string | null): AdminBreadcrumb[] {
  if (!pathname || !pathname.startsWith("/admin")) {
    return [{ label: "Dashboard", href: "/admin" }];
  }

  const flat = flattenNavItemsForBreadcrumbs();
  const exact = flat.find((item) => isNavActive(pathname, item.href) && pathname === item.href.split("?")[0]);
  if (exact) {
    const crumbs: AdminBreadcrumb[] = [{ label: "Dashboard", href: "/admin" }];
    const group = adminNavGroups.find((g) => g.items.some((i) => i.href === exact.href));
    if (group && group.id !== "dashboard") {
      crumbs.push({ label: group.label, href: group.items[0]?.href.startsWith(`/${group.id}`) ? undefined : undefined });
      if (group.id === "website" && exact.href !== "/admin/website") {
        crumbs.push({ label: "Website", href: "/admin/website" });
      }
    }
    crumbs.push({ label: exact.label });
    return crumbs;
  }

  const parts = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  const crumbs: AdminBreadcrumb[] = [{ label: "Dashboard", href: "/admin" }];

  let acc = "/admin";
  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    const navMatch = flat.find((item) => item.href.split("?")[0] === acc);
    const label = navMatch?.label ?? titleCase(parts[i] ?? "");
    if (parts[0] === "website" && i === 0 && !navMatch) {
      crumbs.push(isLast ? { label: "Website" } : { label: "Website", href: "/admin/website" });
      continue;
    }
    crumbs.push(isLast ? { label } : { label, href: acc });
  }

  return crumbs;
}
