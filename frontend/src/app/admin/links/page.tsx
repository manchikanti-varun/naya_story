"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { useToast } from "@/components/admin/ui/AdminToast";

type LinkItem = {
  label: string;
  path: string;
  description: string;
};

type CategoryInfo = { name: string; slug: string; id: string };
type ProductInfo = { name: string; slug: string };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md p-1.5 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-sunken)] hover:text-[var(--admin-ink)]"
      title="Copy link"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
    </button>
  );
}

function LinkRow({ item }: { item: LinkItem }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--admin-border)] px-4 py-3 transition hover:border-[var(--admin-border-strong)]">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--admin-ink)]">{item.label}</p>
        <p className="mt-0.5 font-mono text-xs text-[var(--admin-accent)]">{item.path}</p>
        <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">{item.description}</p>
      </div>
      <CopyButton text={item.path} />
    </div>
  );
}

function LinkSection({ title, links }: { title: string; links: LinkItem[] }) {
  if (links.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[var(--admin-muted)]">
        {title}
      </h3>
      <div className="space-y-2">
        {links.map((item) => (
          <LinkRow key={item.path} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function AdminLinksPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    void (async () => {
      try {
        const [siteData, productData] = await Promise.all([
          apiFetch<{ settings: { homepage: { globalCategories?: CategoryInfo[] } } }>("/content/site"),
          apiFetch<{ products: ProductInfo[] }>("/products?limit=200&sort=newest", { token }),
        ]);
        setCategories(
          (siteData.settings.homepage.globalCategories ?? [])
            .filter((c: any) => c.enabled !== false)
            .map((c: any) => ({ name: c.name, slug: c.slug, id: c.id })),
        );
        setProducts((productData.products ?? []).map((p) => ({ name: p.name, slug: p.slug })));
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const staticLinks: LinkItem[] = [
    { label: "Home", path: "/", description: "Store homepage" },
    { label: "Collections", path: "/collections", description: "All products browse page" },
    { label: "New In", path: "/new-in", description: "New arrivals page" },
    { label: "Our Story", path: "/our-story", description: "Brand story page" },
    { label: "Compare", path: "/compare", description: "Product comparison page" },
    { label: "Login", path: "/login", description: "Customer login" },
    { label: "Register", path: "/register", description: "Customer registration" },
    { label: "Checkout", path: "/checkout", description: "Checkout page" },
    { label: "Account", path: "/account", description: "Customer account dashboard" },
    { label: "Orders", path: "/account/orders", description: "Customer order history" },
    { label: "Wishlist", path: "/account/wishlist", description: "Saved products" },
    { label: "Addresses", path: "/account/addresses", description: "Delivery addresses" },
  ];

  const collectionTabLinks: LinkItem[] = [
    { label: "All (default)", path: "/collections", description: "All tab selected" },
    { label: "Bestselling tab", path: "/collections?tab=bestselling", description: "Bestselling products tab" },
    { label: "New In tab", path: "/collections?tab=new-in", description: "New arrivals tab" },
  ];

  const categoryLinks: LinkItem[] = categories.map((c) => ({
    label: c.name,
    path: `/collections?tab=${encodeURIComponent(c.id)}`,
    description: `${c.name} category tab`,
  }));

  const productLinks: LinkItem[] = products.map((p) => ({
    label: p.name,
    path: `/products/${p.slug}`,
    description: "Product detail page",
  }));

  return (
    <AdminPageLayout
      title="Store Links"
      description="Copy-paste ready links for carousels, CTAs, navigation, and banners."
    >
      <AdminCard padding="md">
        <p className="font-sans text-sm text-[var(--admin-muted)]">
          Use these links when configuring hero carousels, announcement bars, CTAs, footer links,
          or anywhere that asks for a URL. Click the copy icon to grab the path.
        </p>
      </AdminCard>

      <div className="space-y-8">
        <LinkSection title="Pages" links={staticLinks} />
        <LinkSection title="Collection Tabs" links={collectionTabLinks} />
        <LinkSection title="Categories" links={categoryLinks} />

        {loading ? (
          <div className="py-6 text-center text-sm text-[var(--admin-muted)]">
            Loading products...
          </div>
        ) : (
          <LinkSection title={`Products (${products.length})`} links={productLinks} />
        )}
      </div>
    </AdminPageLayout>
  );
}
