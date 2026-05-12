"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyPlus, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Product } from "@/types";
import { cn } from "@/lib/cn";

function totalStock(p: Product) {
  return p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
}

function statusLabel(p: Product) {
  if (p.storefrontVisible === false) return "Hidden";
  if (totalStock(p) <= 0) return "Out of stock";
  if (totalStock(p) <= 5) return "Low stock";
  return "Active";
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      params.set("sort", "newest");
      if (q.trim()) params.set("q", q.trim());
      if (category.trim()) params.set("category", category.trim());
      const data = await apiFetch<{ products: Product[] }>(`/products?${params.toString()}`, { token });
      setProducts(data.products);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token, q, category]);

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh();
    }, 280);
    return () => clearTimeout(t);
  }, [refresh]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => {
      if (p.category) s.add(p.category);
    });
    return [...s].sort();
  }, [products]);

  async function remove(id: string) {
    if (!token || !confirm("Delete this product permanently?")) return;
    await apiFetch(`/products/${id}`, { method: "DELETE", token });
    await refresh();
  }

  async function duplicate(p: Product) {
    if (!token) return;
    const slug = `${p.slug}-copy-${Date.now().toString(36)}`.slice(0, 120);
    const raw = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
    delete raw._id;
    delete raw.__v;
    delete raw.createdAt;
    delete raw.updatedAt;
    await apiFetch("/products", {
      method: "POST",
      token,
      body: JSON.stringify({
        ...raw,
        name: `${p.name} (copy)`,
        slug,
        variants: p.variants.map((v) => ({
          ...v,
          sku: `${v.sku}-COPY-${Date.now().toString(36).slice(-4)}`,
        })),
      }),
    });
    await refresh();
  }

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Catalog</p>
          <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">Products</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-slate-600">
            Single global catalog — search, edit, duplicate, or preview. Homepage rails use the{" "}
            <Link href="/admin/content" className="font-medium text-slate-900 underline-offset-2 hover:underline">
              Content editor
            </Link>{" "}
            to pick products (no duplicate IDs).
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm hover:bg-slate-800"
        >
          New product
        </Link>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900"
            placeholder="Search name, description, tags…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 lg:w-56"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Storefront</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  Loading catalog…
                </td>
              </tr>
            ) : null}
            {!loading &&
              products.map((p) => {
                const thumb = p.images[0];
                const status = statusLabel(p);
                return (
                  <tr key={p._id} className="text-slate-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 overflow-hidden rounded-lg bg-slate-100">
                          {thumb ? (
                            <Image src={thumb} alt="" fill className="object-cover" sizes="40px" unoptimized />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{p.category}</td>
                    <td className="px-4 py-3 text-slate-600">{p.collection || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹{p.price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{totalStock(p)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                          status === "Active" && "bg-emerald-50 text-emerald-800",
                          status === "Low stock" && "bg-amber-50 text-amber-900",
                          status === "Out of stock" && "bg-red-50 text-red-800",
                          status === "Hidden" && "bg-slate-100 text-slate-600",
                        )}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {p.storefrontVisible === false ? "Hidden" : "Live"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/preview/product/${p.slug}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Preview storefront"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Duplicate"
                          onClick={() => void duplicate(p)}
                        >
                          <CopyPlus className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Delete"
                          onClick={() => void remove(p._id)}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {!loading &&
          products.map((p) => {
            const thumb = p.images[0];
            const status = statusLabel(p);
            return (
              <div key={p._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {thumb ? (
                      <Image src={thumb} alt="" fill className="object-cover" sizes="64px" unoptimized />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="capitalize">{p.category}</span>
                      <span>·</span>
                      <span>₹{p.price.toLocaleString("en-IN")}</span>
                      <span>·</span>
                      <span>{totalStock(p)} in stock</span>
                    </div>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        status === "Active" && "bg-emerald-50 text-emerald-800",
                        status === "Low stock" && "bg-amber-50 text-amber-900",
                        status === "Out of stock" && "bg-red-50 text-red-800",
                        status === "Hidden" && "bg-slate-100 text-slate-600",
                      )}
                    >
                      {status}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/admin/preview/product/${p.slug}`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                  <Link
                    href={`/admin/products/${p._id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700"
                    onClick={() => void duplicate(p)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-red-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-600"
                    onClick={() => void remove(p._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {!loading && products.length === 0 ? (
        <p className="text-center font-sans text-sm text-slate-500">No products match your filters.</p>
      ) : null}
    </div>
  );
}
