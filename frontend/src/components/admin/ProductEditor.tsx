"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Product, ProductVariant } from "@/types";
import { ProductImagesField } from "@/components/admin/ProductImagesField";
import { normalizeProductCaptions } from "@/lib/product-gallery";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminTabs } from "@/components/admin/ui/AdminTabs";
import { AdminStickySaveBar } from "@/components/admin/ui/AdminStickySaveBar";
import { AdminCombobox } from "@/components/admin/ui/AdminCombobox";
import { cn } from "@/lib/cn";
import { consolidateProductDescription } from "@/lib/product-description";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";

type TabId = "general" | "commerce" | "photos" | "shop";

const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "commerce", label: "Price & stock" },
  { id: "photos", label: "Photos" },
  { id: "shop", label: "Shop display" },
];

const inputClass = "admin-input mt-1.5 w-full";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("admin-label block", className)}>
      {label}
      {children}
    </label>
  );
}

const defaultVariant = (): ProductVariant => ({
  sku: `NS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
  size: "S",
  color: "Ivory",
  stock: 5,
});

const emptyProduct = (): Partial<Product> & {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  variants: ProductVariant[];
} => ({
  name: "",
  slug: "",
  description: "",
  price: 0,
  compareAtPrice: undefined,
  taxRate: 0,
  discountPercent: 0,
  category: "",
  collection: "",
  images: [""],
  imageCaptions: [],
  hoverImage: "",
  variants: [defaultVariant()],
  pdpPrintDisclaimer: "",
  pdpDeliveryRange: "",
  pdpFreeShippingNote: "",
  pdpDeliveryAndCare: "",
  featured: false,
  bestseller: false,
  trending: false,
  newIn: false,
  newInOrder: 0,
  newInHoverImage: "",
  newInVisible: true,
  storefrontVisible: true,
  lowStockDisplay: "hide" as const,
});

export function ProductEditor({
  productSlug,
  token,
}: {
  productSlug: string | null;
  token: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(Boolean(productSlug));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [productId, setProductId] = useState<string | null>(null);

  // Fetch existing categories from all products for the combobox
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch<{ products: { category: string }[] }>(
          "/products?limit=500",
          { token },
        );
        if (cancelled) return;
        const cats = [...new Set(
          (data.products ?? [])
            .map((p) => p.category)
            .filter(Boolean),
        )].sort();
        setExistingCategories(cats);
      } catch {
        // non-critical, field still works as free text
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!productSlug) {
      setLoading(false);
      setForm(emptyProduct());
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch<{ product: Product }>(`/products/slug/${productSlug}`, { token });
        const p = data.product;
        if (!p || cancelled) {
          if (!cancelled) setMsg("Product not found.");
          return;
        }
        setProductId(p._id);
        setForm({
          ...p,
          description: consolidateProductDescription(p),
          shortDescription: "",
          fabricDetails: "",
          stylingSuggestions: "",
          images: p.images?.length ? p.images : [""],
          imageCaptions: p.imageCaptions ?? [],
          variants: p.variants?.length ? p.variants : [defaultVariant()],
        });
      } catch (e) {
        if (!cancelled) {
          setMsg(`Failed to load product: ${(e as Error).message ?? "Unknown error"}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productSlug, token]);

  const payload = useMemo(() => {
    const images = form.images.map((s) => s.trim()).filter(Boolean);
    const imageCaptions = normalizeProductCaptions(images, form.imageCaptions);
    return {
      ...form,
      description: form.description.trim(),
      shortDescription: "",
      fabricDetails: "",
      stylingSuggestions: "",
      subcategory: "",
      tags: [],
      material: "",
      fitType: "",
      images,
      imageCaptions,
      variants: form.variants.map((v) => ({
        ...v,
        stock: Number(v.stock) || 0,
      })),
      price: Number(form.price) || 0,
      compareAtPrice:
        form.compareAtPrice === undefined || form.compareAtPrice === null
          ? undefined
          : Number(form.compareAtPrice),
      taxRate: Number(form.taxRate) || 0,
      discountPercent: Number(form.discountPercent) || 0,
      newInOrder: Number(form.newInOrder) || 0,
    };
  }, [form]);

  async function save(goToList = false) {
    setMsg(null);
    setSaving(true);
    try {
      if (!payload.name?.trim() || !payload.slug?.trim()) {
        setMsg("Name and slug are required.");
        setTab("general");
        return;
      }
      if (!payload.description?.trim()) {
        setMsg("Description is required.");
        setTab("general");
        return;
      }
      if (!payload.images?.length) {
        setMsg("Add at least one photo.");
        setTab("photos");
        return;
      }
      if (!payload.variants?.length || payload.variants.some((v) => !v.sku || !v.size || !v.color)) {
        setMsg("Each size row needs SKU, size, and color.");
        setTab("commerce");
        return;
      }
      const body = { ...payload } as Record<string, unknown>;
      delete body._id;
      delete body.createdAt;
      delete body.updatedAt;
      if (productId) {
        await apiFetch(`/products/${productId}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(body),
        });
        publishStorefrontSettingsChanged();
        if (goToList) {
          router.push("/admin/products");
          return;
        }
        // If slug changed, update the URL
        if (form.slug && form.slug !== productSlug) {
          router.replace(`/admin/products/${form.slug}`);
        }
        setMsg("Saved.");
      } else {
        const res = await apiFetch<{ product: Product }>("/products", {
          method: "POST",
          token,
          body: JSON.stringify(body),
        });
        publishStorefrontSettingsChanged();
        setProductId(res.product._id);
        if (goToList) {
          router.push("/admin/products");
          return;
        }
        setMsg("Created — you can keep editing or return to the product list.");
        router.replace(`/admin/products/${res.product.slug}`);
      }
    } catch (e) {
      setMsg((e as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading product…</p>;
  }

  const title = productSlug ? form.name?.trim() || "Edit product" : "New product";

  return (
    <AdminPageLayout
      className="pb-28"
      maxWidthClass="max-w-4xl"
      title={title}
      description={
        <span className="block space-y-1">
          <Link href="/admin/products" className="admin-back-link">
            ← Products
          </Link>
          {productSlug ? <span className="block font-mono text-sm text-[var(--admin-muted)]">/{form.slug}</span> : null}
        </span>
      }
      actions={
        productSlug ? (
          <Link href={`/admin/preview/product/${form.slug}`} className="admin-btn admin-btn--secondary admin-btn--sm">
            Preview
          </Link>
        ) : undefined
      }
    >
      {msg ? (
        <p
          className={cn(
            "rounded-[var(--admin-radius-sm)] px-3 py-2 text-sm",
            msg.includes("fail") || msg.includes("required") || msg.includes("needs")
              ? "bg-red-50 text-red-800"
              : "bg-emerald-50 text-emerald-900",
          )}
        >
          {msg}
        </p>
      ) : null}

      <AdminTabs tabs={TABS} activeId={tab} onChange={(id) => setTab(id as TabId)} />

      <div className="admin-panel mt-6 p-5 sm:p-6">
        {tab === "general" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name">
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="URL slug">
              <input className={inputClass} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </Field>
            <Field label="Category">
              <AdminCombobox
                value={form.category}
                options={existingCategories}
                onChange={(val) => setForm((f) => ({ ...f, category: val }))}
                placeholder="Type to search or add new category…"
              />
            </Field>
            <Field label="Collection label">
              <input
                className={inputClass}
                value={form.collection ?? ""}
                placeholder="e.g. summer-edit, festive-2025"
                onChange={(e) => setForm((f) => ({ ...f, collection: e.target.value }))}
              />
              <span className="mt-1 block text-[11px] text-[var(--admin-muted)]">
                Groups products into themed sets (e.g. &quot;Summer Edit&quot;). Used for /collections?collection=slug filtering.
              </span>
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea
                className={cn(inputClass, "min-h-[160px]")}
                placeholder="Story and details for the product page. Use lines starting with > for bullet points."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
            <p className="md:col-span-2 text-xs text-[var(--admin-muted)]">
              Compare, Share, delivery, and shipping lines are set under the Shop display tab.
            </p>
          </div>
        ) : null}

        {tab === "commerce" ? (
          <div className="space-y-6">
            <p className="text-xs leading-relaxed text-[var(--admin-muted)]">
              <strong className="font-medium text-[var(--admin-ink)]">Price</strong> — what the customer pays.{" "}
              <strong className="font-medium text-[var(--admin-ink)]">Compare at</strong> — original/MRP price shown crossed out (leave blank if no discount).{" "}
              <strong className="font-medium text-[var(--admin-ink)]">Tax %</strong> — GST rate added at checkout.{" "}
              <strong className="font-medium text-[var(--admin-ink)]">Discount %</strong> — auto-calculated off the selling price (used for badge display).
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Selling price (₹)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Compare at (MRP)">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="Optional"
                  value={form.compareAtPrice ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      compareAtPrice: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                />
              </Field>
              <Field label="Tax %">
                <input
                  type="number"
                  className={inputClass}
                  value={form.taxRate ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Discount %">
                <input
                  type="number"
                  className={inputClass}
                  value={form.discountPercent ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
                />
              </Field>
            </div>

            <div>
              <p className="admin-label mb-1">Sizes &amp; stock</p>
              <p className="mb-3 text-xs text-[var(--admin-muted)]">
                Each row is a variant the customer can buy.{" "}
                <strong className="font-medium text-[var(--admin-ink)]">SKU</strong> — unique code for your internal tracking.{" "}
                <strong className="font-medium text-[var(--admin-ink)]">Stock</strong> — how many units are available to sell.
              </p>
              <div className="space-y-3">
                {form.variants.map((v, i) => (
                  <div
                    key={i}
                    className="grid gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] p-4 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <Field label="SKU">
                      <input
                        className={inputClass}
                        value={v.sku}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[i] = { ...v, sku: e.target.value };
                          setForm((f) => ({ ...f, variants: next }));
                        }}
                      />
                    </Field>
                    <Field label="Size">
                      <input
                        className={inputClass}
                        value={v.size}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[i] = { ...v, size: e.target.value };
                          setForm((f) => ({ ...f, variants: next }));
                        }}
                      />
                    </Field>
                    <Field label="Color">
                      <input
                        className={inputClass}
                        value={v.color}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[i] = { ...v, color: e.target.value };
                          setForm((f) => ({ ...f, variants: next }));
                        }}
                      />
                    </Field>
                    <Field label="Stock">
                      <input
                        type="number"
                        className={inputClass}
                        value={v.stock}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[i] = { ...v, stock: Number(e.target.value) };
                          setForm((f) => ({ ...f, variants: next }));
                        }}
                      />
                    </Field>
                    <div className="flex justify-end sm:col-span-2 lg:col-span-4">
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600 hover:underline"
                        onClick={() => {
                          const next = form.variants.filter((_, j) => j !== i);
                          setForm((f) => ({ ...f, variants: next.length ? next : [defaultVariant()] }));
                        }}
                      >
                        Remove row
                      </button>
                    </div>
                  </div>
                ))}
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, variants: [...f.variants, defaultVariant()] }))}
                >
                  Add size row
                </AdminButton>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "photos" ? (
          <div className="space-y-5">
            <ProductImagesField
              token={token}
              images={form.images}
              captions={form.imageCaptions}
              onChange={(images, imageCaptions) =>
                setForm((f) => ({
                  ...f,
                  images: images.length ? images : [""],
                  imageCaptions,
                }))
              }
            />
          </div>
        ) : null}

        {tab === "shop" ? (
          <div className="space-y-6">
            <div>
              <p className="admin-label mb-1">Visibility</p>
              <p className="mb-3 text-xs text-[var(--admin-muted)]">
                Controls where this product appears on the storefront.
              </p>
              <div className="grid gap-2 sm:grid-cols-1">
                <label className="flex cursor-pointer items-start gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] px-3 py-3">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.storefrontVisible !== false}
                    onChange={(e) => setForm((f) => ({ ...f, storefrontVisible: e.target.checked }))}
                  />
                  <div>
                    <span className="text-sm font-medium text-[var(--admin-ink)]">Visible on store</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--admin-muted)]">Product appears in collections, search, and has a live page. Turn off to hide without deleting.</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <p className="admin-label mb-1">Badges &amp; rails</p>
              <p className="mb-3 text-xs text-[var(--admin-muted)]">
                Toggling these auto-shows the product in the matching sections. No extra CMS step needed.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["featured", "Featured", "Prioritized in default sort order across collections.", Boolean(form.featured)],
                    ["bestseller", "Bestseller", "Shows in the Bestsellers rail on homepage.", Boolean(form.bestseller)],
                    ["newIn", "New In", "Shows in New In rail on homepage + /new-in page.", Boolean(form.newIn)],
                    ["trending", "Trending", "Can be used for a trending badge or filter.", Boolean(form.trending)],
                  ] as const
                ).map(([key, label, hint, checked]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] px-3 py-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      onChange={(e) => setForm((f) => ({
                        ...f,
                        [key]: e.target.checked,
                        // When New In is toggled, also sync newInVisible
                        ...(key === "newIn" ? { newInVisible: e.target.checked } : {}),
                      }))}
                    />
                    <div>
                      <span className="text-sm font-medium text-[var(--admin-ink)]">{label}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--admin-muted)]">{hint}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Field label="New In sort order (lower = first)">
              <input
                type="number"
                className={cn(inputClass, "max-w-[8rem]")}
                value={form.newInOrder ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, newInOrder: Number(e.target.value) || 0 }))}
              />
            </Field>

            <div>
              <p className="admin-label mb-1">Low stock banner</p>
              <p className="mb-3 text-xs text-[var(--admin-muted)]">
                Shows &quot;Only X left — Hurry!&quot; urgency banner on the product page.
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.lowStockDisplay === "show"}
                  onChange={(e) => setForm((f) => ({ ...f, lowStockDisplay: e.target.checked ? "show" : "hide" }))}
                />
                <div>
                  <span className="text-sm font-medium text-[var(--admin-ink)]">Show low stock banner</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--admin-muted)]">
                    Displays the &quot;Only X left&quot; urgency message to customers.
                  </span>
                </div>
              </label>
            </div>

            <div className="border-t border-[var(--admin-border)] pt-6">
              <p className="admin-label mb-1">Product page (storefront)</p>
              <p className="mb-4 text-xs text-[var(--admin-muted)]">
                <strong className="font-medium text-[var(--admin-ink)]">Compare</strong> and{" "}
                <strong className="font-medium text-[var(--admin-ink)]">Share</strong> are automatic on
                every product — not edited here. Set delivery and care copy below; leave blank for site
                defaults.
              </p>
              <div className="space-y-4">
                <Field label="Print disclaimer (below description)">
                  <textarea
                    className={cn(inputClass, "min-h-[56px]")}
                    value={form.pdpPrintDisclaimer ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, pdpPrintDisclaimer: e.target.value }))}
                  />
                </Field>
                <Field label="Estimated delivery (e.g. 23 May – 27 May)">
                  <input
                    className={inputClass}
                    placeholder="Leave blank for auto date range"
                    value={form.pdpDeliveryRange ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, pdpDeliveryRange: e.target.value }))}
                  />
                </Field>
                <Field label="Free shipping line">
                  <input
                    className={inputClass}
                    placeholder="Leave blank for default threshold copy"
                    value={form.pdpFreeShippingNote ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, pdpFreeShippingNote: e.target.value }))}
                  />
                </Field>
                <Field label="Delivery & care (accordion)">
                  <textarea
                    className={cn(inputClass, "min-h-[88px]")}
                    value={form.pdpDeliveryAndCare ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, pdpDeliveryAndCare: e.target.value }))}
                  />
                </Field>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <AdminStickySaveBar message="Save when you are done editing. New products open here so you can keep editing.">
        <AdminButton variant="secondary" disabled={saving} onClick={() => void save(true)}>
          Save &amp; back to list
        </AdminButton>
        <AdminButton variant="primary" disabled={saving} onClick={() => void save(false)}>
          {saving ? "Saving…" : "Save product"}
        </AdminButton>
      </AdminStickySaveBar>
    </AdminPageLayout>
  );
}
