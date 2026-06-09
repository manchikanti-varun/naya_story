"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyPlus, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import type { Product } from "@/types";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminConfirmModal } from "@/components/admin/ui/AdminModal";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminToolbar } from "@/components/admin/ui/AdminToolbar";
import { useToast } from "@/components/admin/ui/AdminToast";

function totalStock(p: Product) { return p.variants.reduce((s, v) => s + (v.stock ?? 0), 0); }
function statusLabel(p: Product) {
  if (p.storefrontVisible === false) return "Hidden";
  if (totalStock(p) <= 0) return "Out of stock";
  if (totalStock(p) <= 5) return "Low stock";
  return "Active";
}
function statusTone(s: string): "success" | "warning" | "danger" | "neutral" {
  if (s === "Active") return "success";
  if (s === "Low stock") return "warning";
  if (s === "Out of stock") return "danger";
  return "neutral";
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200", sort: "newest" });
      if (q.trim()) params.set("q", q.trim());
      if (category.trim()) params.set("category", category.trim());
      const data = await apiFetch<{ products: Product[] }>(`/products?${params}`, { token });
      setProducts(data.products);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [token, q, category]);

  useEffect(() => { const t = setTimeout(() => void refresh(), 280); return () => clearTimeout(t); }, [refresh]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);

  async function remove(id: string) {
    if (!token) return;
    await apiFetch(`/products/${id}`, { method: "DELETE", token });
    publishStorefrontSettingsChanged();
    toast.success("Product deleted");
    setDeleteTarget(null);
    await refresh();
  }

  async function duplicate(p: Product) {
    if (!token) return;
    const slug = `${p.slug}-copy-${Date.now().toString(36)}`.slice(0, 120);
    const raw = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
    delete raw._id; delete raw.__v; delete raw.createdAt; delete raw.updatedAt;
    await apiFetch("/products", { method: "POST", token, body: JSON.stringify({ ...raw, name: `${p.name} (copy)`, slug, variants: p.variants.map((v) => ({ ...v, sku: `${v.sku}-COPY-${Date.now().toString(36).slice(-4)}` })) }) });
    toast.success(`"${p.name}" duplicated`);
    await refresh();
  }

  return (
    <AdminPageLayout
      title="Products"
      description={`${products.length} products in catalog`}
      actions={<Link href="/admin/products/new" className="admin-btn admin-btn--primary admin-btn--sm"><Plus className="h-3.5 w-3.5" strokeWidth={2} /> Add product</Link>}
      toolbar={
        <AdminToolbar className="w-full border-0 bg-transparent p-0 shadow-none">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
            <AdminInput className="!mt-0 pl-9" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="admin-input w-full shrink-0 sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </AdminToolbar>
      }
    >
      <AdminConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void remove(deleteTarget); }} title="Delete product?" description="This product will be permanently removed." confirmLabel="Delete" />

      {!loading && products.length === 0 ? (
        <AdminEmptyState title="No products found" description="Try a different search or add your first product." />
      ) : (
        <AdminTable>
          <table className="admin-table">
            <thead><tr>
              <th>Product</th><th>Category</th><th className="text-right">Price</th><th className="text-right">Stock</th><th>Status</th><th className="text-right">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="py-10 text-center text-[var(--admin-muted)]">Loading…</td></tr> : null}
              {!loading && products.map((p) => {
                const thumb = p.images[0];
                const status = statusLabel(p);
                return (
                  <tr key={p._id}>
                    <td>
                      <Link href={`/admin/products/${p.slug}`} className="flex items-center gap-3 group">
                        <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md bg-stone-100">
                          {thumb ? <Image src={thumb} alt="" fill className="object-cover" sizes="32px" unoptimized /> : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--admin-ink)] group-hover:text-[var(--admin-accent)]">{p.name}</p>
                          <p className="font-mono text-[10px] text-[var(--admin-faint)]">{p.slug}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="capitalize text-[var(--admin-muted)]">{p.category}</td>
                    <td className="text-right font-medium tabular-nums">₹{p.price.toLocaleString("en-IN")}</td>
                    <td className="text-right tabular-nums text-[var(--admin-muted)]">{totalStock(p)}</td>
                    <td><AdminBadge tone={statusTone(status)}>{status}</AdminBadge></td>
                    <td className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Link href={`/admin/products/${p.slug}`} className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]" title="Edit"><Pencil className="h-3.5 w-3.5" strokeWidth={1.5} /></Link>
                        <button type="button" className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]" title="Duplicate" onClick={() => void duplicate(p)}><CopyPlus className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                        <button type="button" className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => setDeleteTarget(p._id)}><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AdminTable>
      )}
    </AdminPageLayout>
  );
}
