import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  FileText,
  Globe,
  ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Navigation2,
  Package,
  Palette,
  Percent,
  Server,
  Shield,
  ShoppingBag,
  Sparkles,
  Truck,
  Undo2,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  keywords?: string[];
  /** Hidden from sidebar — still reachable via command palette if needed */
  hidden?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
  defaultOpen?: boolean;
};

/**
 * Workflow-based admin IA (Shopify Plus–style): how merchants operate the business,
 * not how the repo is split. Sidebar + command palette read from this list only.
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "dashboard",
    label: "Home",
    defaultOpen: true,
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        keywords: ["home", "metrics", "revenue", "overview"],
      },
    ],
  },
  {
    id: "website",
    label: "Website",
    defaultOpen: true,
    items: [
      {
        href: "/admin/website",
        label: "Website overview",
        icon: Globe,
        keywords: ["storefront", "hub", "what customers see"],
        hidden: true,
      },
      {
        href: "/admin/website/pages",
        label: "Pages",
        icon: FileText,
        keywords: ["homepage", "collections browse", "new in", "our story", "cms", "builder", "edit homepage"],
      },
      {
        href: "/admin/website/navigation",
        label: "Navigation",
        icon: Navigation2,
        keywords: ["menu", "header", "links", "primary"],
      },
      {
        href: "/admin/website/footer",
        label: "Footer",
        icon: LayoutGrid,
        keywords: ["legal", "social", "links"],
      },
      {
        href: "/admin/website/legal-pages",
        label: "Legal pages",
        icon: Shield,
        keywords: ["terms", "privacy", "refund", "shipping", "policies"],
      },
      {
        href: "/admin/website/announcement-bar",
        label: "Announcement bar",
        icon: Megaphone,
        keywords: ["promo", "strip", "top bar"],
      },
      {
        href: "/admin/website/theme",
        label: "Theme",
        icon: Palette,
        keywords: ["colors", "typography", "brand", "theme studio"],
      },
      {
        href: "/admin/media",
        label: "Media library",
        icon: ImageIcon,
        keywords: ["images", "assets", "upload"],
      },
    ],
  },
  {
    id: "products",
    label: "Products",
    defaultOpen: false,
    items: [
      {
        href: "/admin/products",
        label: "Products",
        icon: Package,
        keywords: ["catalog", "sku", "add product"],
      },
      {
        href: "/admin/products/new",
        label: "Add product",
        icon: Package,
        keywords: ["create", "new"],
        hidden: true,
      },
      {
        href: "/admin/inventory",
        label: "Inventory",
        icon: Boxes,
        keywords: ["stock", "low stock"],
      },
    ],
  },
  {
    id: "orders",
    label: "Orders",
    defaultOpen: false,
    items: [
      {
        href: "/admin/orders",
        label: "Orders",
        icon: ShoppingBag,
        keywords: ["fulfillment", "tracking", "status"],
      },
      {
        href: "/admin/orders/shipping",
        label: "Fulfillment",
        icon: Truck,
        keywords: ["shipping", "labels", "carriers"],
      },
      {
        href: "/admin/orders/returns",
        label: "Returns",
        icon: Undo2,
        keywords: ["rma", "refund", "exchange"],
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    defaultOpen: false,
    items: [
      {
        href: "/admin/customers",
        label: "Customers",
        icon: Users,
        keywords: ["buyers", "email"],
      },
      {
        href: "/admin/customers/segments",
        label: "Segments",
        icon: LayoutGrid,
        keywords: ["audience", "crm"],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      {
        href: "/admin/coupons",
        label: "Coupons",
        icon: Percent,
        keywords: ["discount", "code"],
      },
      {
        href: "/admin/marketing/campaigns",
        label: "Campaigns",
        icon: Megaphone,
        keywords: ["promotions", "email", "drops"],
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        keywords: ["sales", "trend", "reports"],
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        href: "/admin/settings",
        label: "Settings",
        icon: Server,
        keywords: ["environment", "api", "general"],
      },
      {
        href: "/admin/system/roles",
        label: "Roles & permissions",
        icon: Shield,
        keywords: ["rbac", "access", "staff"],
      },
      {
        href: "/admin/pages",
        label: "Admin map",
        icon: Globe,
        keywords: ["reference", "sitemap", "all routes"],
      },
    ],
  },
];

/** Legacy `/admin/content/*` routes (redirect to Website builder); hidden from sidebar */
export const legacyContentLinks: AdminNavItem[] = [
  { href: "/admin/content/hero", label: "Hero", hidden: true, keywords: ["homepage"] },
  { href: "/admin/content/bestsellers", label: "Bestsellers", hidden: true },
  { href: "/admin/content/new-in-home", label: "New In (home)", hidden: true },
  { href: "/admin/content/new-in-page", label: "New In page", hidden: true },
  { href: "/admin/content/collections", label: "Collections browse", hidden: true },
  { href: "/admin/content/categories", label: "Shop by category", hidden: true },
  { href: "/admin/content/our-story", label: "Our Story", hidden: true },
  { href: "/admin/content/footer", label: "Footer", hidden: true },
  { href: "/admin/content/promo-bar", label: "Announcement bar", hidden: true },
  { href: "/admin/content/theme", label: "Theme", hidden: true },
  { href: "/admin/content/newsletter", label: "Newsletter", hidden: true },
  { href: "/admin/content/editorial", label: "Editorial", hidden: true },
  { href: "/admin/content/home-layout", label: "Home layout", hidden: true },
  { href: "/admin/content/preview/hero", label: "Section preview", icon: Sparkles, hidden: true },
];

/** @deprecated Renamed to `legacyContentLinks` — kept for older imports (e.g. breadcrumbs). */
export const contentSectionLinks = legacyContentLinks;

export function flattenNavItems(): AdminNavItem[] {
  const visible = adminNavGroups.flatMap((g) => g.items.filter((i) => !i.hidden));
  const shortcuts: AdminNavItem[] = [
    {
      href: "/admin/products/new",
      label: "Add product",
      icon: Package,
      keywords: ["create", "new product"],
    },
    {
      href: "/admin/media",
      label: "Media library",
      icon: ImageIcon,
      keywords: ["upload", "images"],
    },
  ];
  const seen = new Set(visible.map((i) => i.href));
  return [
    ...visible,
    ...shortcuts.filter((s) => !seen.has(s.href)),
    ...legacyContentLinks.filter((i) => !i.hidden),
  ];
}

/** Sidebar + legacy content routes — for breadcrumbs and deep links. */
export function flattenNavItemsForBreadcrumbs(): AdminNavItem[] {
  return [...adminNavGroups.flatMap((g) => g.items), ...legacyContentLinks];
}

export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";

  const path = href.split("?")[0]!;

  if (pathname === path && !href.includes("?")) return true;

  /** Hub only — not child routes like /admin/website/homepage */
  if (path === "/admin/website") {
    return pathname === "/admin/website";
  }

  if (path === "/admin/website/pages") {
    return (
      pathname === "/admin/website/pages" ||
      pathname === "/admin/website/homepage" ||
      (pathname.startsWith("/admin/content/") && !pathname.startsWith("/admin/content/preview")) ||
      pathname.startsWith("/admin/storefront/homepage")
    );
  }

  if (path === "/admin/website/navigation") {
    return pathname === "/admin/website/navigation" || pathname.startsWith("/admin/storefront/navigation");
  }

  if (path === "/admin/products") {
    return pathname === "/admin/products" || pathname.startsWith("/admin/products/");
  }

  if (path === "/admin/orders") {
    return pathname === "/admin/orders";
  }

  if (path === "/admin/orders/shipping") {
    return pathname.startsWith("/admin/orders/shipping") || pathname.startsWith("/admin/orders/tracking");
  }

  if (path === "/admin/orders/returns") {
    return pathname.startsWith("/admin/orders/returns");
  }

  if (path === "/admin/customers") {
    return (
      pathname === "/admin/customers" ||
      (pathname.startsWith("/admin/customers/") && !pathname.startsWith("/admin/customers/segments"))
    );
  }

  if (path === "/admin/customers/segments") {
    return pathname.startsWith("/admin/customers/segments");
  }

  if (path === "/admin/marketing/campaigns") {
    return pathname.startsWith("/admin/marketing/");
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}
