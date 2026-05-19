"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Product, ProductVariant } from "@/types";
import { cn } from "@/lib/cn";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";

type SectionKey = "basic" | "pricing" | "inventory" | "taxonomy" | "media" | "flags";

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
  images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80"],
  hoverImage: "",
  variants: [defaultVariant()],
  material: "",
  fitType: "",
  fabricDetails: "",
  stylingSuggestions: "",
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between px-5 py-4 text-left font-display text-lg text-slate-900 hover:bg-slate-50"
      >
        {title}
        <span className="font-sans text-xs text-slate-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? <div className="border-t border-slate-100 px-5 py-5">{children}</div> : null}
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
  });
  const [form, setForm] = useState(emptyProduct);
  const [tagInput, setTagInput] = useState("");
  const [imageInput, setImageInput] = useState("");

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      const base = emptyProduct();
      setForm(base);
      setTagInput("");
      setImageInput(base.images.join("\n"));
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
          variants: p.variants?.length ? p.variants : [defaultVariant()],
        });
        setTagInput((p.tags ?? []).join(", "));
        setImageInput((p.images ?? []).join("\n"));
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
    const images = imageInput
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = tagInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      ...form,
      images: images.length ? images : form.images.filter(Boolean),
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
  }, [form, imageInput, tagInput]);

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
    return <p className="font-sans text-sm text-slate-500">Loading product…</p>;
  }

  return (
    <div className="pb-28">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/products" className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-700">
            ← Products
          </Link>
          <h1 className="mt-2 font-display text-3xl text-slate-900">
            {productId ? "Edit product" : "New product"}
          </h1>
        </div>
        {productId ? (
          <Link
            href={`/admin/preview/product/${form.slug}`}
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-slate-800 shadow-sm hover:bg-slate-50"
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
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Product name
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Slug
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </label>
            <label className="md:col-span-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Short description
              <textarea
                className="mt-2 min-h-[72px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.shortDescription ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
              />
            </label>
            <label className="md:col-span-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Full description
              <textarea
                className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
          </div>
        </Collapsible>

        <Collapsible title="Pricing" id="pricing" open={openSections.pricing} onToggle={toggle}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Price (₹)
              <input
                type="number"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Compare at (optional)
              <input
                type="number"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.compareAtPrice ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    compareAtPrice: e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Tax rate %
              <input
                type="number"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.taxRate ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))}
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Discount %
              <input
                type="number"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
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
                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  SKU
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900"
                    value={v.sku}
                    onChange={(e) => {
                      const next = [...form.variants];
                      next[i] = { ...v, sku: e.target.value };
                      setForm((f) => ({ ...f, variants: next }));
                    }}
                  />
                </label>
                <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Size
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900"
                    value={v.size}
                    onChange={(e) => {
                      const next = [...form.variants];
                      next[i] = { ...v, size: e.target.value };
                      setForm((f) => ({ ...f, variants: next }));
                    }}
                  />
                </label>
                <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Color
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900"
                    value={v.color}
                    onChange={(e) => {
                      const next = [...form.variants];
                      next[i] = { ...v, color: e.target.value };
                      setForm((f) => ({ ...f, variants: next }));
                    }}
                  />
                </label>
                <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Stock
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900"
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
              className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 hover:border-slate-400"
              onClick={() => setForm((f) => ({ ...f, variants: [...f.variants, defaultVariant()] }))}
            >
              Add variant
            </button>
          </div>
        </Collapsible>

        <Collapsible title="Categories & attributes" id="taxonomy" open={openSections.taxonomy} onToggle={toggle}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Category
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Subcategory
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.subcategory ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Collection label
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.collection ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, collection: e.target.value }))}
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Tags (comma-separated)
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Material
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.material ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
              />
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Fit type
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.fitType ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, fitType: e.target.value }))}
              />
            </label>
            <label className="md:col-span-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Fabric details
              <textarea
                className="mt-2 min-h-[72px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.fabricDetails ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, fabricDetails: e.target.value }))}
              />
            </label>
            <label className="md:col-span-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Styling suggestions
              <textarea
                className="mt-2 min-h-[72px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.stylingSuggestions ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, stylingSuggestions: e.target.value }))}
              />
            </label>
          </div>
        </Collapsible>

        <Collapsible title="Product media" id="media" open={openSections.media} onToggle={toggle}>
          <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Gallery image URLs (one per line)
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
            />
          </label>
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Card hover image (optional)
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="Overrides second gallery image for hover"
              value={form.hoverImage ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, hoverImage: e.target.value }))}
            />
          </label>
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            New In hover image (optional)
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={form.newInHoverImage ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, newInHoverImage: e.target.value }))}
            />
          </label>
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
              <label key={key} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean((form as Record<string, unknown>)[key])}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                />
                <span className="font-sans text-sm text-slate-800">{label}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.newInVisible !== false}
                onChange={(e) => setForm((f) => ({ ...f, newInVisible: e.target.checked }))}
              />
              <span className="font-sans text-sm text-slate-800">Visible in New In rail</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.storefrontVisible !== false}
                onChange={(e) => setForm((f) => ({ ...f, storefrontVisible: e.target.checked }))}
              />
              <span className="font-sans text-sm text-slate-800">Visible on storefront (uncheck to hide)</span>
            </label>
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 sm:col-span-2">
              New In manual order
              <input
                type="number"
                className="mt-2 w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                value={form.newInOrder ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, newInOrder: Number(e.target.value) || 0 }))}
              />
            </label>
          </div>
        </Collapsible>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-4 pt-10">
        <div className="pointer-events-auto flex w-[min(100%-2rem,42rem)] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="hidden text-xs text-slate-500 sm:block">Changes sync to the API on save.</p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="ml-auto rounded-full bg-slate-900 px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </div>
  );
}
