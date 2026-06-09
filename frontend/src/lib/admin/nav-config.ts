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
  Ruler,
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
 * Unified admin IA — restructured for Phase 10.
 * Groups: Dashboard, Commerce, Content, Marketing, Analytics, Settings
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
    id: "commerce",
    label: "Commerce",
    defaultOpen: true,
    items: [
      {
        href: "/admin/products",
        label: "Products",
        icon: Package,
        keywords: ["catalog", "sku", "add product"],
      },
      {
        href: "/admin/orders",
        label: "Orders",
        icon: ShoppingBag,
        keywords: ["fulfillment", "tracking", "status"],
      },
      {
        href: "/admin/customers",
        label: "Customers",
        icon: Users,
        keywords: ["buyers", "email", "crm"],
      },
      {
        href: "/admin/inventory",
        label: "Inventory",
        icon: Boxes,
        keywords: ["stock", "low stock", "restock"],
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    defaultOpen: true,
    items: [
      {
        href: "/admin/website/pages",
        label: "Page Builder",
        icon: FileText,
        keywords: ["homepage", "cms", "builder", "sections", "hero", "editorial", "pages"],
      },
      {
        href: "/admin/media",
        label: "Media Library",
        icon: ImageIcon,
        keywords: ["images", "assets", "upload", "cloudinary"],
      },
      {
        href: "/admin/website/navigation",
        label: "Navigation",
        icon: Navigation2,
        keywords: ["menu", "header", "links"],
      },
      {
        href: "/admin/website/footer",
        label: "Footer",
        icon: LayoutGrid,
        keywords: ["footer", "social", "contact"],
      },
      {
        href: "/admin/website/legal-pages",
        label: "Legal Pages",
        icon: Shield,
        keywords: ["terms", "privacy", "refund", "shipping", "policies"],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    defaultOpen: false,
    items: [
      {
        href: "/admin/coupons",
        label: "Coupons",
        icon: Percent,
        keywords: ["discount", "code", "promo"],
      },
      {
        href: "/admin/website/announcement-bar",
        label: "Announcements",
        icon: Megaphone,
        keywords: ["promo", "strip", "top bar", "banner"],
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    defaultOpen: false,
    items: [
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        keywords: ["sales", "trend", "reports", "revenue"],
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    defaultOpen: false,
    items: [
      {
        href: "/admin/website/theme",
        label: "Theme",
        icon: Palette,
        keywords: ["colors", "typography", "brand", "theme studio"],
      },
      {
        href: "/admin/website/product-page",
        label: "Product Page",
        icon: Package,
        keywords: ["pdp", "suggested", "size chart"],
        hidden: true,
      },
      {
        href: "/admin/website/size-chart",
        label: "Size Chart",
        icon: Ruler,
        keywords: ["size guide", "fit", "measurements"],
        hidden: true,
      },
      {
        href: "/admin/settings",
        label: "Environment",
        icon: Server,
        keywords: ["api", "general", "environment"],
      },
    ],
  },
];

/** Legacy `/admin/content/*` routes */
export const legacyContentLinks: AdminNavItem[] = [
  { href: "/admin/content/hero", label: "Hero", hidden: true, keywords: ["homepage"] },
  { href: "/admin/content/bestsellers", label: "Bestsellers", hidden: true },
  { href: "/admin/website/pages?tab=homepage&edit=newIn", label: "New In (home)", hidden: true },
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

/** @deprecated Renamed to `legacyContentLinks` */
export const contentSectionLinks = legacyContentLinks;

export function flattenNavItems(): AdminNavItem[] {
  const visible = adminNavGroups.flatMap((g) => g.items.filter((i) => !i.hidden));
  const shortcuts: AdminNavItem[] = [
    { href: "/admin/products/new", label: "Add product", icon: Package, keywords: ["create", "new product"] },
  ];
  const seen = new Set(visible.map((i) => i.href));
  return [
    ...visible,
    ...shortcuts.filter((s) => !seen.has(s.href)),
    ...legacyContentLinks.filter((i) => !i.hidden),
  ];
}

export function flattenNavItemsForBreadcrumbs(): AdminNavItem[] {
  return [...adminNavGroups.flatMap((g) => g.items), ...legacyContentLinks];
}

export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";

  const path = href.split("?")[0]!;

  if (pathname === path && !href.includes("?")) return true;

  if (path === "/admin/website") return pathname === "/admin/website";

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

  if (path === "/admin/orders") return pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");
  if (path === "/admin/customers") return pathname === "/admin/customers" || pathname.startsWith("/admin/customers/");
  if (path === "/admin/media") return pathname === "/admin/media";
  if (path === "/admin/analytics") return pathname === "/admin/analytics";
  if (path === "/admin/coupons") return pathname === "/admin/coupons";
  if (path === "/admin/inventory") return pathname === "/admin/inventory";

  return pathname === path || pathname.startsWith(`${path}/`);
}
