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
  name: "Untitled piece",
  slug: `piece-${Date.now()}`,
  description: "Describe fabric, mood, and gesture. Start lines with > for bullet points.",
  price: 8900,
  compareAtPrice: undefined,
  taxRate: 0,
  discountPercent: 0,
  category: "dresses",
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
});

export function ProductEditor({
  productId,
  token,
}: {
  productId: string | null;
  token: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setForm(emptyProduct());
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiFetch<{ products: Product[] }>(`/products?ids=${productId}`, { token });
        const p = data.products[0];
        if (!p || cancelled) return;
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, token]);

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
        setMsg("Saved.");
      } else {
        const res = await apiFetch<{ product: Product }>("/products", {
          method: "POST",
          token,
          body: JSON.stringify(body),
        });
        publishStorefrontSettingsChanged();
        if (goToList) {
          router.push("/admin/products");
          return;
        }
        setMsg("Created — you can keep editing or return to the product list.");
        router.replace(`/admin/products/${res.product._id}`);
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

  const title = productId ? form.name?.trim() || "Edit product" : "New product";

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
          {productId ? <span className="block font-mono text-sm text-[var(--admin-muted)]">/{form.slug}</span> : null}
        </span>
      }
      actions={
        productId ? (
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
              <input className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </Field>
            <Field label="Collection label">
              <input
                className={inputClass}
                value={form.collection ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, collection: e.target.value }))}
              />
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Price (₹)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Compare at">
                <input
                  type="number"
                  className={inputClass}
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
              <p className="admin-label mb-3">Sizes &amp; stock</p>
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
              <p className="admin-label mb-3">Visibility &amp; badges</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["storefrontVisible", "Show on shop", form.storefrontVisible !== false],
                    ["featured", "Featured", Boolean(form.featured)],
                    ["bestseller", "Bestseller", Boolean(form.bestseller)],
                    ["newIn", "New In badge", Boolean(form.newIn)],
                    ["trending", "Trending", Boolean(form.trending)],
                    ["newInVisible", "Show in New In rail", form.newInVisible !== false],
                  ] as const
                ).map(([key, label, checked]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-3 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] px-3 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    <span className="text-sm text-[var(--admin-ink)]">{label}</span>
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
