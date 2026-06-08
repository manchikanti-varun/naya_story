"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyPlus, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Product } from "@/types";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminToolbar } from "@/components/admin/ui/AdminToolbar";

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "Active") return "success";
  if (status === "Low stock") return "warning";
  if (status === "Out of stock") return "danger";
  return "neutral";
}

function totalStock(p: Product) {
  return p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
}

function statusLabel(p: Product) {
  if (p.storefrontVisible === false) return "Hidden";
  if (totalStock(p) <= 0) return "Out of stock";
  if (totalStock(p) <= 5) return "Low stock";
  return "Active";
}

const rowActionClass =
  "rounded-lg p-2 text-[var(--admin-muted)] transition hover:bg-black/[0.04] hover:text-[var(--admin-ink)]";

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
      setSelected(new Set());
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

  async function bulkDelete() {
    if (!token || selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} product${selected.size > 1 ? "s" : ""} permanently? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        [...selected].map((id) => apiFetch(`/products/${id}`, { method: "DELETE", token })),
      );
    } finally {
      setBulkDeleting(false);
      await refresh();
    }
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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p._id)));
    }
  }

  return (
    <AdminPageLayout title="Products" description="Search, edit, duplicate, or preview your catalog."
      actions={
        <Link href="/admin/products/new" className="admin-btn admin-btn--md admin-btn--primary">
          New product
        </Link>
      }
      toolbar={
        <AdminToolbar className="w-full border-0 bg-transparent p-0 shadow-none sm:flex-nowrap">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]"
              strokeWidth={1.75}
            />
            <AdminInput
              className="!mt-0 pl-9"
              placeholder="Search name, description, tags…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="admin-input w-full shrink-0 sm:w-52"
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
        </AdminToolbar>
      }
    >
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-3">
          <span className="font-sans text-sm font-medium text-[var(--admin-ink)]">
            {selected.size} selected
          </span>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 font-sans text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            disabled={bulkDeleting}
            onClick={() => void bulkDelete()}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            {bulkDeleting ? "Deleting…" : `Delete ${selected.size}`}
          </button>
          <button
            type="button"
            className="font-sans text-xs text-[var(--admin-muted)] underline-offset-4 hover:underline"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      <AdminTable>
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--admin-border-strong)]"
                  checked={products.length > 0 && selected.size === products.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Product</th>
              <th>Category</th>
              <th>Collection</th>
              <th className="text-right">Price</th>
              <th className="text-right">Stock</th>
              <th>Status</th>
              <th>Storefront</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-[var(--admin-muted)]">
                  Loading catalog…
                </td>
              </tr>
            ) : null}
            {!loading &&
              products.map((p) => {
                const thumb = p.images[0];
                const status = statusLabel(p);
                return (
                  <tr key={p._id} className={selected.has(p._id) ? "bg-[var(--admin-accent)]/5" : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--admin-border-strong)]"
                        checked={selected.has(p._id)}
                        onChange={() => toggleSelect(p._id)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 overflow-hidden rounded-lg bg-stone-100">
                          {thumb ? (
                            <Image src={thumb} alt="" fill className="object-cover" sizes="40px" unoptimized />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="font-mono text-[11px] text-[var(--admin-faint)]">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">{p.category}</td>
                    <td className="text-[var(--admin-muted)]">{p.collection || "—"}</td>
                    <td className="text-right font-medium tabular-nums">₹{p.price.toLocaleString("en-IN")}</td>
                    <td className="text-right tabular-nums">{totalStock(p)}</td>
                    <td>
                      <AdminBadge tone={statusTone(status)}>{status}</AdminBadge>
                    </td>
                    <td className="text-[var(--admin-muted)]">
                      {p.storefrontVisible === false ? "Hidden" : "Live"}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Link href={`/admin/preview/product/${p.slug}`} className={rowActionClass} title="Preview">
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                        <Link href={`/admin/products/${p.slug}`} className={rowActionClass} title="Edit">
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                        <button type="button" className={rowActionClass} title="Duplicate" onClick={() => void duplicate(p)}>
                          <CopyPlus className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
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
      </AdminTable>

      <div className="space-y-3 md:hidden">
        {loading ? <p className="text-sm text-[var(--admin-muted)]">Loading…</p> : null}
        {!loading &&
          products.map((p) => {
            const thumb = p.images[0];
            const status = statusLabel(p);
            return (
              <AdminCard key={p._id} padding="md" className={selected.has(p._id) ? "ring-2 ring-[var(--admin-accent)]" : undefined}>
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--admin-border-strong)]"
                    checked={selected.has(p._id)}
                    onChange={() => toggleSelect(p._id)}
                  />
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    {thumb ? (
                      <Image src={thumb} alt="" fill className="object-cover" sizes="64px" unoptimized />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="font-mono text-[11px] text-[var(--admin-faint)]">{p.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--admin-muted)]">
                      <span className="capitalize">{p.category}</span>
                      <span>·</span>
                      <span>₹{p.price.toLocaleString("en-IN")}</span>
                      <span>·</span>
                      <span>{totalStock(p)} in stock</span>
                    </div>
                    <AdminBadge tone={statusTone(status)} className="mt-2">
                      {status}
                    </AdminBadge>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-3">
                  <Link
                    href={`/admin/preview/product/${p.slug}`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[var(--admin-border-strong)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                  <Link
                    href={`/admin/products/${p.slug}`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[#1c1917] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--admin-border-strong)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    onClick={() => void duplicate(p)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-red-200 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-700"
                    onClick={() => void remove(p._id)}
                  >
                    Delete
                  </button>
                </div>
              </AdminCard>
            );
          })}
      </div>

      {!loading && products.length === 0 ? (
        <AdminEmptyState title="No products found" description="Try a different search or category filter." />
      ) : null}
    </AdminPageLayout>
  );
}
