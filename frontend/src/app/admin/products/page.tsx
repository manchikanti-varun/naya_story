"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CopyPlus,
  Eye,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import { consolidateProductDescription } from "@/lib/product-description";
import { normalizeProductCaptions } from "@/lib/product-gallery";
import type { Product, ProductVariant } from "@/types";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminCombobox } from "@/components/admin/ui/AdminCombobox";
import { AdminConfirmModal } from "@/components/admin/ui/AdminModal";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { ProductImagesField } from "@/components/admin/ProductImagesField";
import { useToast } from "@/components/admin/ui/AdminToast";
import { cn } from "@/lib/cn";

// ============================================
// HELPERS
// ============================================

function totalStock(p: Product) {
  return p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
}

function statusLabel(p: Product) {
  if (p.storefrontVisible === false) return "Hidden";
  if (totalStock(p) <= 0) return "Out of stock";
  if (totalStock(p) <= 5) return "Low stock";
  return "Active";
}

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "Active") return "success";
  if (status === "Low stock") return "warning";
  if (status === "Out of stock") return "danger";
  return "neutral";
}

const defaultVariant = (): ProductVariant => ({
  sku: `NS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
  size: "S",
  color: "Ivory",
  stock: 5,
});

const emptyProduct = (): Partial<Product> & {
  name: string; slug: string; description: string; price: number;
  category: string; images: string[]; variants: ProductVariant[];
} => ({
  name: "", slug: "", description: "", price: 0, compareAtPrice: undefined,
  taxRate: 0, discountPercent: 0, category: "", collection: "",
  images: [], imageCaptions: [], hoverImage: "", variants: [defaultVariant()],
  pdpPrintDisclaimer: "", pdpDeliveryRange: "", pdpFreeShippingNote: "", pdpDeliveryAndCare: "",
  featured: false, bestseller: false, trending: false, newIn: false,
  newInOrder: 0, newInHoverImage: "", newInVisible: true, storefrontVisible: true,
  lowStockDisplay: "hide" as const,
});

const inputClass = "admin-input mt-1.5 w-full";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("admin-label block", className)}>{label}{children}</label>;
}

// ============================================
// MAIN WORKSPACE
// ============================================

export default function AdminProductsWorkspace() {
  const { token } = useAuth();
  const toast = useToast();
  const router = useRouter();

  // List state
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [listLoading, setListLoading] = useState(true);

  // Editor state
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct());
  const [productId, setProductId] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Load product list
  const refreshList = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200", sort: "newest" });
      if (q.trim()) params.set("q", q.trim());
      if (categoryFilter.trim()) params.set("category", categoryFilter.trim());
      const data = await apiFetch<{ products: Product[] }>(`/products?${params}`, { token });
      setProducts(data.products);
    } catch { setProducts([]); }
    finally { setListLoading(false); }
  }, [token, q, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(() => void refreshList(), 280);
    return () => clearTimeout(t);
  }, [refreshList]);

  // Load categories
  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const data = await apiFetch<{ products: { category: string }[] }>("/products?limit=500", { token });
        setExistingCategories([...new Set(data.products.map((p) => p.category).filter(Boolean))].sort());
      } catch {}
    })();
  }, [token]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => { if (p.category) s.add(p.category); });
    return [...s].sort();
  }, [products]);

  // Load product into editor
  const loadProduct = useCallback(async (slug: string) => {
    if (!token) return;
    setEditorLoading(true);
    setIsDirty(false);
    try {
      const data = await apiFetch<{ product: Product }>(`/products/slug/${slug}`, { token });
      const p = data.product;
      setProductId(p._id);
      setForm({
        ...p,
        description: consolidateProductDescription(p),
        shortDescription: "", fabricDetails: "", stylingSuggestions: "",
        images: p.images?.length ? p.images : [],
        imageCaptions: p.imageCaptions ?? [],
        variants: p.variants?.length ? p.variants : [defaultVariant()],
      });
      setSelectedSlug(slug);
    } catch {
      toast.error("Failed to load product");
    } finally { setEditorLoading(false); }
  }, [token, toast]);

  // New product
  function startNewProduct() {
    setSelectedSlug(null);
    setProductId(null);
    setForm(emptyProduct());
    setIsDirty(false);
  }

  // Mark dirty on form changes
  function updateForm(updater: (f: typeof form) => typeof form) {
    setForm(updater);
    setIsDirty(true);
  }

  // Save
  async function save() {
    if (!token) return;
    setSaving(true);
    try {
      const images = form.images.map((s) => s.trim()).filter(Boolean);
      const imageCaptions = normalizeProductCaptions(images, form.imageCaptions);
      const body: Record<string, unknown> = {
        ...form, images, imageCaptions,
        description: form.description.trim(),
        shortDescription: "", fabricDetails: "", stylingSuggestions: "", subcategory: "", tags: [], material: "", fitType: "",
        variants: form.variants.map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
        price: Number(form.price) || 0,
        compareAtPrice: form.compareAtPrice == null ? undefined : Number(form.compareAtPrice),
        taxRate: Number(form.taxRate) || 0, discountPercent: Number(form.discountPercent) || 0,
        newInOrder: Number(form.newInOrder) || 0,
      };
      delete body._id; delete body.createdAt; delete body.updatedAt;

      if (!body.name || !body.slug) { toast.error("Name and slug are required."); return; }
      if (!body.description) { toast.error("Description is required."); return; }
      if (!(body.images as string[]).length) { toast.error("Add at least one photo."); return; }

      if (productId) {
        await apiFetch(`/products/${productId}`, { method: "PATCH", token, body: JSON.stringify(body) });
        publishStorefrontSettingsChanged();
        toast.success("Product saved");
        setIsDirty(false);
        if (form.slug !== selectedSlug) setSelectedSlug(form.slug);
      } else {
        const res = await apiFetch<{ product: Product }>("/products", { method: "POST", token, body: JSON.stringify(body) });
        publishStorefrontSettingsChanged();
        setProductId(res.product._id);
        setSelectedSlug(res.product.slug);
        toast.success("Product created");
        setIsDirty(false);
      }
      await refreshList();
    } catch (e) { toast.error((e as Error).message ?? "Save failed"); }
    finally { setSaving(false); }
  }

  // Delete
  async function deleteProduct(id: string) {
    if (!token) return;
    await apiFetch(`/products/${id}`, { method: "DELETE", token });
    publishStorefrontSettingsChanged();
    toast.success("Product deleted");
    setDeleteTarget(null);
    if (productId === id) startNewProduct();
    await refreshList();
  }

  // Duplicate
  async function duplicate(p: Product) {
    if (!token) return;
    const slug = `${p.slug}-copy-${Date.now().toString(36)}`.slice(0, 120);
    const raw = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
    delete raw._id; delete raw.__v; delete raw.createdAt; delete raw.updatedAt;
    await apiFetch("/products", { method: "POST", token, body: JSON.stringify({
      ...raw, name: `${p.name} (copy)`, slug,
      variants: p.variants.map((v) => ({ ...v, sku: `${v.sku}-COPY-${Date.now().toString(36).slice(-4)}` })),
    }) });
    toast.success(`"${p.name}" duplicated`);
    await refreshList();
  }

  // ============================================
  // LEFT PANEL — Product List
  // ============================================
  const leftPanel = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[var(--admin-border)] px-3 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-sans text-sm font-bold text-[var(--admin-ink)]">Products</h2>
          <div className="flex gap-1">
            <button type="button" onClick={() => void refreshList()} disabled={listLoading}
              className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-50" title="Refresh">
              <RefreshCw className={cn("h-3.5 w-3.5", listLoading && "animate-spin")} strokeWidth={1.75} />
            </button>
            <button type="button" onClick={startNewProduct}
              className="rounded-md bg-[var(--admin-accent)] p-1.5 text-white" title="New product">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
          <input
            className="admin-input w-full py-1.5 pl-8 text-xs"
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="admin-input mt-2 w-full py-1.5 text-xs" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {listLoading ? (
          <p className="px-3 py-8 text-center text-xs text-[var(--admin-muted)]">Loading…</p>
        ) : products.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-[var(--admin-muted)]">No products found</p>
        ) : (
          <div className="divide-y divide-[var(--admin-border)]">
            {products.map((p) => {
              const isActive = selectedSlug === p.slug;
              const thumb = p.images[0];
              const status = statusLabel(p);
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => void loadProduct(p.slug)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition",
                    isActive ? "bg-[var(--admin-accent-soft)] border-l-2 border-l-[var(--admin-accent)]" : "hover:bg-[var(--admin-surface-raised)]",
                  )}
                >
                  <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md bg-stone-100">
                    {thumb ? <Image src={thumb} alt="" fill className="object-cover" sizes="32px" unoptimized /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-xs font-medium text-[var(--admin-ink)]">{p.name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="font-sans text-[10px] tabular-nums text-[var(--admin-muted)]">₹{p.price.toLocaleString("en-IN")}</span>
                      <span className="text-[var(--admin-border)]">·</span>
                      <AdminBadge tone={statusTone(status)} className="!text-[8px] !px-1.5 !py-0">{status}</AdminBadge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // CENTER PANEL — Editor Canvas
  // ============================================
  const centerPanel = editorLoading ? (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-[var(--admin-muted)]">Loading product…</p>
    </div>
  ) : !selectedSlug && !productId && form.name === "" ? (
    <div className="flex h-full items-center justify-center">
      <div className="text-center max-w-xs">
        <Package className="mx-auto h-10 w-10 text-[var(--admin-faint)]" strokeWidth={1} />
        <p className="mt-3 font-sans text-sm font-medium text-[var(--admin-ink)]">Select a product or create new</p>
        <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">Choose from the list or click + to start a new product</p>
        <AdminButton variant="primary" size="sm" className="mt-4" onClick={startNewProduct}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New product
        </AdminButton>
      </div>
    </div>
  ) : (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-3xl space-y-6 pb-24">
        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Basic Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name">
              <input className={inputClass} value={form.name} onChange={(e) => updateForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="URL slug">
              <input className={inputClass} value={form.slug} onChange={(e) => updateForm((f) => ({ ...f, slug: e.target.value }))} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={cn(inputClass, "min-h-[120px]")} value={form.description}
              onChange={(e) => updateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Story and details for the product page…" />
          </Field>
        </section>

        {/* Media Gallery */}
        <section className="space-y-4">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Media Gallery</h3>
          <ProductImagesField
            token={token}
            images={form.images}
            captions={form.imageCaptions}
            onChange={(images, imageCaptions) => updateForm((f) => ({ ...f, images: images.length ? images : [], imageCaptions }))}
          />
        </section>

        {/* Pricing */}
        <section className="space-y-4">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Pricing</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Price (₹)">
              <input type="number" className={inputClass} value={form.price} onChange={(e) => updateForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </Field>
            <Field label="Compare at (MRP)">
              <input type="number" className={inputClass} placeholder="Optional" value={form.compareAtPrice ?? ""}
                onChange={(e) => updateForm((f) => ({ ...f, compareAtPrice: e.target.value === "" ? undefined : Number(e.target.value) }))} />
            </Field>
            <Field label="Tax %">
              <input type="number" className={inputClass} value={form.taxRate ?? 0} onChange={(e) => updateForm((f) => ({ ...f, taxRate: Number(e.target.value) }))} />
            </Field>
            <Field label="Discount %">
              <input type="number" className={inputClass} value={form.discountPercent ?? 0} onChange={(e) => updateForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))} />
            </Field>
          </div>
          {form.compareAtPrice && form.price > 0 ? (
            <p className="text-xs text-emerald-700">
              Customer sees: <span className="line-through">₹{form.compareAtPrice.toLocaleString("en-IN")}</span> → ₹{form.price.toLocaleString("en-IN")}
              {" "}({Math.round(((form.compareAtPrice - form.price) / form.compareAtPrice) * 100)}% off)
            </p>
          ) : null}
        </section>

        {/* Variant Matrix */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Variants ({form.variants.length})</h3>
            <AdminButton type="button" variant="secondary" size="sm"
              onClick={() => updateForm((f) => ({ ...f, variants: [...f.variants, defaultVariant()] }))}>
              <Plus className="h-3 w-3" strokeWidth={2} /> Add row
            </AdminButton>
          </div>
          <div className="overflow-x-auto rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--admin-surface-raised)]">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.1em] text-[var(--admin-faint)]">Size</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.1em] text-[var(--admin-faint)]">Color</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.1em] text-[var(--admin-faint)]">SKU</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-[0.1em] text-[var(--admin-faint)]">Stock</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {form.variants.map((v, i) => (
                  <tr key={i} className="group">
                    <td className="px-2 py-1.5">
                      <input className="admin-input w-full py-1 text-xs" value={v.size}
                        onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, size: e.target.value }; updateForm((f) => ({ ...f, variants: next })); }} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="admin-input w-full py-1 text-xs" value={v.color}
                        onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, color: e.target.value }; updateForm((f) => ({ ...f, variants: next })); }} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="admin-input w-full py-1 font-mono text-xs" value={v.sku}
                        onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, sku: e.target.value }; updateForm((f) => ({ ...f, variants: next })); }} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" className="admin-input w-20 py-1 text-right text-xs" value={v.stock}
                        onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, stock: Number(e.target.value) }; updateForm((f) => ({ ...f, variants: next })); }} />
                    </td>
                    <td className="px-1 py-1.5">
                      <button type="button" className="rounded p-1 text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        onClick={() => { const next = form.variants.filter((_, j) => j !== i); updateForm((f) => ({ ...f, variants: next.length ? next : [defaultVariant()] })); }}>
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Product Content */}
        <section className="space-y-4">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Product Page Content</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estimated delivery">
              <input className={inputClass} placeholder="e.g. 23 May – 27 May" value={form.pdpDeliveryRange ?? ""}
                onChange={(e) => updateForm((f) => ({ ...f, pdpDeliveryRange: e.target.value }))} />
            </Field>
            <Field label="Free shipping note">
              <input className={inputClass} placeholder="Leave blank for default" value={form.pdpFreeShippingNote ?? ""}
                onChange={(e) => updateForm((f) => ({ ...f, pdpFreeShippingNote: e.target.value }))} />
            </Field>
          </div>
          <Field label="Delivery & care">
            <textarea className={cn(inputClass, "min-h-[80px]")} value={form.pdpDeliveryAndCare ?? ""}
              onChange={(e) => updateForm((f) => ({ ...f, pdpDeliveryAndCare: e.target.value }))} />
          </Field>
        </section>
      </div>
    </div>
  );

  // ============================================
  // RIGHT PANEL — Properties (Sticky)
  // ============================================
  const rightPanel = (selectedSlug || productId || form.name) ? (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[var(--admin-border)] px-4 py-3">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Properties</h3>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Status */}
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Status</p>
          <label className="mt-2 flex cursor-pointer items-center gap-2.5 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-3 py-2.5">
            <input type="checkbox" checked={form.storefrontVisible !== false}
              onChange={(e) => updateForm((f) => ({ ...f, storefrontVisible: e.target.checked }))} />
            <span className="font-sans text-xs font-medium text-[var(--admin-ink)]">
              {form.storefrontVisible !== false ? "Live on storefront" : "Hidden"}
            </span>
          </label>
        </div>

        {/* Category */}
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Category</p>
          <AdminCombobox value={form.category} options={existingCategories}
            onChange={(val) => updateForm((f) => ({ ...f, category: val }))} placeholder="Select or type…" />
        </div>

        {/* Collection */}
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Collection</p>
          <input className="admin-input mt-1.5 w-full text-xs" placeholder="e.g. summer-edit"
            value={form.collection ?? ""} onChange={(e) => updateForm((f) => ({ ...f, collection: e.target.value }))} />
        </div>

        {/* Badges */}
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)] mb-2">Badges</p>
          <div className="space-y-1.5">
            {([
              ["featured", "Featured", form.featured],
              ["bestseller", "Bestseller", form.bestseller],
              ["newIn", "New In", form.newIn],
              ["trending", "Trending", form.trending],
            ] as const).map(([key, label, checked]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--admin-surface-raised)]">
                <input type="checkbox" checked={Boolean(checked)}
                  onChange={(e) => updateForm((f) => ({ ...f, [key]: e.target.checked, ...(key === "newIn" ? { newInVisible: e.target.checked } : {}) }))} />
                <span className="font-sans text-xs text-[var(--admin-ink)]">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Low stock display */}
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)] mb-2">Urgency</p>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--admin-surface-raised)]">
            <input type="checkbox" checked={form.lowStockDisplay === "show"}
              onChange={(e) => updateForm((f) => ({ ...f, lowStockDisplay: e.target.checked ? "show" : "hide" }))} />
            <span className="font-sans text-xs text-[var(--admin-ink)]">Show low stock banner</span>
          </label>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--admin-border)] pt-4 space-y-2">
          {selectedSlug ? (
            <Link href={`/admin/preview/product/${form.slug || selectedSlug}`}
              className="admin-btn admin-btn--secondary admin-btn--sm w-full justify-center">
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> Preview
            </Link>
          ) : null}
          {productId ? (
            <>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm w-full justify-center text-[var(--admin-muted)]"
                onClick={() => { const p = products.find((x) => x._id === productId); if (p) void duplicate(p); }}>
                <CopyPlus className="h-3.5 w-3.5" strokeWidth={1.5} /> Duplicate
              </button>
              <button type="button" className="admin-btn admin-btn--sm w-full justify-center border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setDeleteTarget(productId)}>
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Delete
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  ) : null;

  // ============================================
  // STICKY SAVE BAR
  // ============================================
  const saveBar = isDirty ? (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 lg:left-[calc(260px+50%)] lg:-translate-x-1/2">
      <div className="admin-save-bar flex items-center gap-3 px-5 py-3">
        <span className="font-sans text-xs font-medium text-[var(--admin-muted)]">Unsaved changes</span>
        <AdminButton variant="secondary" size="sm" onClick={() => { setForm(emptyProduct()); setIsDirty(false); }}>
          Discard
        </AdminButton>
        <AdminButton variant="primary" size="sm" disabled={saving} onClick={() => void save()}>
          <Save className="h-3.5 w-3.5" strokeWidth={1.75} />
          {saving ? "Saving…" : "Save"}
        </AdminButton>
      </div>
    </div>
  ) : null;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-8" style={{ height: "calc(100vh - 60px)" }}>
      <div className="flex h-full overflow-hidden">
        {/* Left Panel */}
        <div className="hidden w-[260px] shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] lg:flex">
          {leftPanel}
        </div>

        {/* Center Panel */}
        <div className="min-w-0 flex-1 bg-[var(--admin-surface-raised)]">
          {centerPanel}
        </div>

        {/* Right Panel */}
        {rightPanel ? (
          <div className="hidden w-[280px] shrink-0 flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface)] xl:flex">
            {rightPanel}
          </div>
        ) : null}
      </div>

      {saveBar}

      {/* Delete Modal */}
      <AdminConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) void deleteProduct(deleteTarget); }}
        title="Delete product?"
        description="This product will be permanently removed from your catalog."
        confirmLabel="Delete"
      />
    </div>
  );
}
