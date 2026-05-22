"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Product, ProductVariant } from "@/types";
import { CmsImageUrlField } from "@/components/admin/cms/CmsImageUrlField";
import { ProductImagesField } from "@/components/admin/ProductImagesField";
import { normalizeProductCaptions } from "@/lib/product-gallery";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminStickySaveBar } from "@/components/admin/ui/AdminStickySaveBar";
import { cn } from "@/lib/cn";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";

const labelClass = "font-sans text-xs font-medium text-[var(--admin-muted)]";
const inputClass = "admin-input mt-1.5 w-full";

type SectionKey = "basic" | "pricing" | "inventory" | "taxonomy" | "media" | "flags" | "pdp";

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
  shortDescription: "",
  description: "Describe fabric, mood, and gesture.",
  price: 8900,
  compareAtPrice: undefined,
  taxRate: 0,
  discountPercent: 0,
  category: "dresses",
  subcategory: "",
  collection: "",
  tags: [],
  images: [""],
  imageCaptions: [],
  hoverImage: "",
  variants: [defaultVariant()],
  material: "",
  fitType: "",
  fabricDetails: "",
  stylingSuggestions: "",
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

function Collapsible({
  title,
  id,
  open,
  onToggle,
  children,
}: {
  title: string;
  id: SectionKey;
  open: boolean;
  onToggle: (id: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-surface overflow-hidden rounded-[var(--admin-radius)]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between px-5 py-4 text-left font-sans text-base font-semibold text-[var(--admin-ink)] transition hover:bg-[var(--admin-surface-raised)]"
      >
        {title}
        <span className="font-sans text-xs text-[var(--admin-faint)]">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="border-t border-[var(--admin-border)] px-5 py-5">{children}</div> : null}
    </section>
  );
}

export function ProductEditor({
  productId,
  token,
}: {
  productId: string | null;
  token: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    basic: true,
    pricing: true,
    inventory: true,
    taxonomy: true,
    media: true,
    flags: true,
    pdp: true,
  });
  const [form, setForm] = useState(emptyProduct);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      const base = emptyProduct();
      setForm(base);
      setTagInput("");
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
          tags: p.tags ?? [],
          images: p.images?.length ? p.images : [""],
          imageCaptions: p.imageCaptions ?? [],
          variants: p.variants?.length ? p.variants : [defaultVariant()],
        });
        setTagInput((p.tags ?? []).join(", "));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, token]);

  const toggle = (id: SectionKey) =>
    setOpenSections((s) => ({
      ...s,
      [id]: !s[id],
    }));

  const payload = useMemo(() => {
    const images = form.images.map((s) => s.trim()).filter(Boolean);
    const imageCaptions = normalizeProductCaptions(images, form.imageCaptions);
    const tags = tagInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      ...form,
      images,
      imageCaptions,
      tags,
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
  }, [form, tagInput]);

  async function save() {
    setMsg(null);
    setSaving(true);
    try {
      if (!payload.name?.trim() || !payload.slug?.trim()) {
        setMsg("Name and slug are required.");
        return;
      }
      if (!payload.description?.trim()) {
        setMsg("Description is required.");
        return;
      }
      if (!payload.images?.length) {
        setMsg("At least one image URL is required.");
        return;
      }
      if (!payload.variants?.length || payload.variants.some((v) => !v.sku || !v.size || !v.color)) {
        setMsg("Each variant needs SKU, size, and color.");
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
        setMsg("Saved.");
      } else {
        const res = await apiFetch<{ product: Product }>("/products", {
          method: "POST",
          token,
          body: JSON.stringify(body),
        });
        publishStorefrontSettingsChanged();
        setMsg("Created.");
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

  return (
    <div className="pb-28">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/products"
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-faint)] hover:text-[var(--admin-ink)]"
          >
            ← Products
          </Link>
          <h1 className="mt-2 font-sans text-2xl font-semibold tracking-tight text-[var(--admin-ink)] md:text-3xl">
            {productId ? "Edit product" : "New product"}
          </h1>
        </div>
        {productId ? (
          <Link
            href={`/admin/preview/product/${form.slug}`}
            className="inline-flex rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-ink)] shadow-sm hover:bg-[var(--admin-surface-raised)]"
          >
            Preview storefront
          </Link>
        ) : null}
      </div>

      {msg ? (
        <p className={cn("mb-4 text-sm", msg.includes("fail") || msg.includes("required") ? "text-red-600" : "text-emerald-600")}>
          {msg}
        </p>
      ) : null}

      <div className="space-y-4">
        <Collapsible title="Basic information" id="basic" open={openSections.basic} onToggle={toggle}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Product name
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className={labelClass}>
              Slug
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </label>
            <label className={cn("md:col-span-2", labelClass)}>
              Short description
              <span className="mt-1 block font-sans text-[11px] font-normal normal-case text-[var(--admin-faint)]">
                Used on cards; on the product page it appears when the full description has no intro
                paragraph.
              </span>
              <textarea
                className={cn(inputClass, "min-h-[72px]")}
                value={form.shortDescription ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
              />
            </label>
            <label className={cn("md:col-span-2", labelClass)}>
              Full description
              <span className="mt-1 block font-sans text-[11px] font-normal normal-case text-[var(--admin-faint)]">
                First paragraph becomes the centered story; lines starting with &gt; become bullets.
              </span>
              <textarea
                className={cn(inputClass, "min-h-[120px]")}
                placeholder="Intro paragraph, then bullet lines starting with &gt; e.g. &gt; Strapless neckline"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
          </div>
        </Collapsible>

        <Collapsible title="Product detail page (storefront)" id="pdp" open={openSections.pdp} onToggle={toggle}>
          <p className="mb-4 font-sans text-xs leading-relaxed text-[var(--admin-muted)]">
            Leave a field blank to use the automatic default. The story block and accordions also use{" "}
            <strong className="text-[var(--admin-ink)]">Full description</strong>,{" "}
            <strong className="text-[var(--admin-ink)]">Short description</strong>, and (under
            Categories) <strong className="text-[var(--admin-ink)]">Fabric details</strong> /{" "}
            <strong className="text-[var(--admin-ink)]">Styling suggestions</strong>.
          </p>
          <div className="grid gap-4">
            <label className={labelClass}>
              Print / uniqueness disclaimer
              <span className="mt-1 block font-sans text-[11px] font-normal normal-case text-[var(--admin-faint)]">
                Small line under the story (default mentions print placement).
              </span>
              <textarea
                className={cn(inputClass, "min-h-[56px]")}
                placeholder="Leave blank for default"
                value={form.pdpPrintDisclaimer ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, pdpPrintDisclaimer: e.target.value }))}
              />
            </label>
            <label className={labelClass}>
              Estimated delivery — date line only
              <span className="mt-1 block font-sans text-[11px] font-normal normal-case text-[var(--admin-faint)]">
                Replaces the computed range (e.g. &ldquo;23 May – 27 May&rdquo;). Heading stays
                &ldquo;Estimated delivery&rdquo;.
              </span>
              <input
                className={inputClass}
                placeholder="Leave blank for automatic range from today"
                value={form.pdpDeliveryRange ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, pdpDeliveryRange: e.target.value }))}
              />
            </label>
            <label className={labelClass}>
              Free shipping — second line
              <span className="mt-1 block font-sans text-[11px] font-normal normal-case text-[var(--admin-faint)]">
                Replaces &ldquo;Orders over ₹15,000&rdquo; (must match checkout if you change the
                threshold).
              </span>
              <input
                className={inputClass}
                placeholder="Leave blank for default threshold text"
                value={form.pdpFreeShippingNote ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, pdpFreeShippingNote: e.target.value }))}
              />
            </label>
            <label className={labelClass}>
              Delivery &amp; care accordion
              <span className="mt-1 block font-sans text-[11px] font-normal normal-case text-[var(--admin-faint)]">
                Full text for the expandable &ldquo;Delivery &amp; care&rdquo; section.
              </span>
              <textarea
                className={cn(inputClass, "min-h-[100px]")}
                placeholder="Leave blank for default shipping + care copy"
                value={form.pdpDeliveryAndCare ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, pdpDeliveryAndCare: e.target.value }))}
              />
            </label>
          </div>
        </Collapsible>

        <Collapsible title="Pricing" id="pricing" open={openSections.pricing} onToggle={toggle}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClass}>
              Price (₹)
              <input
                type="number"
                className={inputClass}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              />
            </label>
            <label className={labelClass}>
              Compare at (optional)
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
            </label>
            <label className={labelClass}>
              Tax rate %
              <input
                type="number"
                className={inputClass}
                value={form.taxRate ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))}
              />
            </label>
            <label className={labelClass}>
              Discount %
              <input
                type="number"
                className={inputClass}
                value={form.discountPercent ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
              />
            </label>
          </div>
        </Collapsible>

        <Collapsible title="Inventory & variants" id="inventory" open={openSections.inventory} onToggle={toggle}>
          <div className="space-y-3">
            {form.variants.map((v, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)]/80 p-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
                  SKU
                  <input
                    className={cn(inputClass, "mt-1 py-1.5")}
                    value={v.sku}
                    onChange={(e) => {
                      const next = [...form.variants];
                      next[i] = { ...v, sku: e.target.value };
                      setForm((f) => ({ ...f, variants: next }));
                    }}
                  />
                </label>
                <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
                  Size
                  <input
                    className={cn(inputClass, "mt-1 py-1.5")}
                    value={v.size}
                    onChange={(e) => {
                      const next = [...form.variants];
                      next[i] = { ...v, size: e.target.value };
                      setForm((f) => ({ ...f, variants: next }));
                    }}
                  />
                </label>
                <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
                  Color
                  <input
                    className={cn(inputClass, "mt-1 py-1.5")}
                    value={v.color}
                    onChange={(e) => {
                      const next = [...form.variants];
                      next[i] = { ...v, color: e.target.value };
                      setForm((f) => ({ ...f, variants: next }));
                    }}
                  />
                </label>
                <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
                  Stock
                  <input
                    type="number"
                    className={cn(inputClass, "mt-1 py-1.5")}
                    value={v.stock}
                    onChange={(e) => {
                      const next = [...form.variants];
                      next[i] = { ...v, stock: Number(e.target.value) };
                      setForm((f) => ({ ...f, variants: next }));
                    }}
                  />
                </label>
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600 hover:underline"
                    onClick={() => {
                      const next = form.variants.filter((_, j) => j !== i);
                      setForm((f) => ({ ...f, variants: next.length ? next : [defaultVariant()] }));
                    }}
                  >
                    Remove variant
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="rounded-full border border-dashed border-[var(--admin-border-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)] hover:border-[var(--admin-border-strong)]"
              onClick={() => setForm((f) => ({ ...f, variants: [...f.variants, defaultVariant()] }))}
            >
              Add variant
            </button>
          </div>
        </Collapsible>

        <Collapsible title="Categories & attributes" id="taxonomy" open={openSections.taxonomy} onToggle={toggle}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Category
              <input
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </label>
            <label className={labelClass}>
              Subcategory
              <input
                className={inputClass}
                value={form.subcategory ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
              />
            </label>
            <label className={labelClass}>
              Collection label
              <input
                className={inputClass}
                value={form.collection ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, collection: e.target.value }))}
              />
            </label>
            <label className={labelClass}>
              Tags (comma-separated)
              <input
                className={inputClass}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Material
              <input
                className={inputClass}
                value={form.material ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
              />
            </label>
            <label className={labelClass}>
              Fit type
              <input
                className={inputClass}
                value={form.fitType ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, fitType: e.target.value }))}
              />
            </label>
            <label className={cn("md:col-span-2", labelClass)}>
              Fabric details
              <span className="mt-1 block font-sans text-[11px] font-normal normal-case text-[var(--admin-faint)]">
                Shown in the story block and/or the &ldquo;Fabric &amp; finish&rdquo; accordion (see
                storefront layout).
              </span>
              <textarea
                className={cn(inputClass, "min-h-[72px]")}
                value={form.fabricDetails ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, fabricDetails: e.target.value }))}
              />
            </label>
            <label className={cn("md:col-span-2", labelClass)}>
              Styling suggestions
              <span className="mt-1 block font-sans text-[11px] font-normal normal-case text-[var(--admin-faint)]">
                Shown as bullets in the story and/or in &ldquo;Styling notes&rdquo; when not already
                listed above.
              </span>
              <textarea
                className={cn(inputClass, "min-h-[72px]")}
                value={form.stylingSuggestions ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, stylingSuggestions: e.target.value }))}
              />
            </label>
          </div>
        </Collapsible>

        <Collapsible title="Product media" id="media" open={openSections.media} onToggle={toggle}>
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
          <div className="mt-4 space-y-4">
            <CmsImageUrlField
              label="Card hover image (optional)"
              token={token}
              hint="Overrides second gallery image on collection cards."
              placeholder="https://…"
              value={form.hoverImage ?? ""}
              onChange={(hoverImage) => setForm((f) => ({ ...f, hoverImage }))}
            />
            <CmsImageUrlField
              label="New In hover image (optional)"
              token={token}
              value={form.newInHoverImage ?? ""}
              onChange={(newInHoverImage) => setForm((f) => ({ ...f, newInHoverImage }))}
            />
          </div>
        </Collapsible>

        <Collapsible title="Merchandising flags" id="flags" open={openSections.flags} onToggle={toggle}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["featured", "Featured"],
                ["bestseller", "Bestseller"],
                ["newIn", "New In"],
                ["trending", "Trending"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean((form as Record<string, unknown>)[key])}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                />
                <span className="font-sans text-sm text-[var(--admin-ink)]">{label}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.newInVisible !== false}
                onChange={(e) => setForm((f) => ({ ...f, newInVisible: e.target.checked }))}
              />
              <span className="font-sans text-sm text-[var(--admin-ink)]">Visible in New In rail</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.storefrontVisible !== false}
                onChange={(e) => setForm((f) => ({ ...f, storefrontVisible: e.target.checked }))}
              />
              <span className="font-sans text-sm text-[var(--admin-ink)]">Visible on storefront (uncheck to hide)</span>
            </label>
            <label className={cn(labelClass, "sm:col-span-2")}>
              New In manual order
              <input
                type="number"
                className={cn(inputClass, "w-40")}
                value={form.newInOrder ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, newInOrder: Number(e.target.value) || 0 }))}
              />
            </label>
          </div>
        </Collapsible>
      </div>

      <AdminStickySaveBar message="Changes sync to the API on save.">
        <AdminButton variant="primary" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save product"}
        </AdminButton>
      </AdminStickySaveBar>
    </div>
  );
}
