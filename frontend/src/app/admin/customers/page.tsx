"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Search, ShoppingBag } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminAvatar } from "@/components/admin/ui/AdminAvatar";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { useToast } from "@/components/admin/ui/AdminToast";

type CustomerRow = { _id: string; name: string; email: string; createdAt: string; orderCount: number; totalSpent: number; lastOrderAt: string | null };
type CustomersResponse = { customers: CustomerRow[]; guestBuyers: { email: string; orderCount: number; totalSpent: number; lastOrderAt: string }[]; summary: { registered: number; withOrders: number; guestOnly: number } };

function formatDate(iso: string | null) { if (!iso) return "—"; return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
function relativeDate(iso: string | null) { if (!iso) return "Never"; const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); if (d === 0) return "Today"; if (d === 1) return "Yesterday"; if (d < 7) return `${d}d ago`; if (d < 30) return `${Math.floor(d / 7)}w ago`; return `${Math.floor(d / 30)}mo ago`; }

function TableSkeleton() {
  return (
    <div className="space-y-3 py-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--admin-surface-sunken)]" />
          <div className="h-4 w-28 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
          <div className="h-4 w-36 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
          <div className="ml-auto h-4 w-12 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
          <div className="h-4 w-16 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
        </div>
      ))}
    </div>
  );
}

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { const res = await apiFetch<CustomersResponse>("/admin/customers", { token }); setData(res); }
    catch { setData(null); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const needle = q.trim().toLowerCase();
  const rows = useMemo(() => (data?.customers ?? []).filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle)).sort((a, b) => { const at = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0; const bt = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0; return bt - at; }), [data, needle]);

  return (
    <AdminPageLayout
      title="Customers"
      toolbar={
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
          <AdminInput className="!mt-0 pl-9" placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      }
    >
      {loading ? <TableSkeleton /> : rows.length === 0 ? (
        <AdminEmptyState title="No customers" description="Customers appear when people create accounts on your store." />
      ) : (
        <AdminTable>
          <table className="admin-table">
            <thead><tr>
              <th>Customer</th><th className="text-right">Orders</th><th className="text-right">Spent</th><th>Last order</th><th>Joined</th>
            </tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._id} className="cursor-pointer" onClick={() => setSelected(c)}>
                  <td>
                    <div className="flex items-center gap-3">
                      <AdminAvatar name={c.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--admin-ink)]">{c.name}</p>
                        <p className="truncate text-[11px] text-[var(--admin-faint)]">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right tabular-nums text-[var(--admin-muted)]">{c.orderCount || "—"}</td>
                  <td className="text-right font-medium tabular-nums">{c.totalSpent > 0 ? `₹${c.totalSpent.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="text-[var(--admin-muted)]">{relativeDate(c.lastOrderAt)}</td>
                  <td className="text-[var(--admin-faint)]">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      )}

      {/* Customer Drawer */}
      <AdminDrawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} description={selected?.email}>
        {selected && <CustomerProfile customer={selected} />}
      </AdminDrawer>
    </AdminPageLayout>
  );
}

function CustomerProfile({ customer }: { customer: CustomerRow }) {
  const aov = customer.orderCount > 0 ? Math.round(customer.totalSpent / customer.orderCount) : 0;
  const toast = useToast();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <AdminCard padding="sm">
          <p className="text-[11px] font-medium text-[var(--admin-muted)]">Lifetime value</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--admin-ink)]">₹{customer.totalSpent.toLocaleString("en-IN")}</p>
        </AdminCard>
        <AdminCard padding="sm">
          <p className="text-[11px] font-medium text-[var(--admin-muted)]">Orders</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--admin-ink)]">{customer.orderCount}</p>
        </AdminCard>
        <AdminCard padding="sm">
          <p className="text-[11px] font-medium text-[var(--admin-muted)]">Avg. order</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--admin-ink)]">{aov > 0 ? `₹${aov.toLocaleString("en-IN")}` : "—"}</p>
        </AdminCard>
        <AdminCard padding="sm">
          <p className="text-[11px] font-medium text-[var(--admin-muted)]">Last purchase</p>
          <p className="mt-1 text-sm font-semibold text-[var(--admin-ink)]">{relativeDate(customer.lastOrderAt)}</p>
        </AdminCard>
      </div>

      {/* Details */}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--admin-muted)]">Email</span>
          <button type="button" onClick={() => { void navigator.clipboard.writeText(customer.email); toast.success("Copied"); }}
            className="text-[var(--admin-ink)] hover:text-[var(--admin-accent)] hover:underline">{customer.email}</button>
        </div>
        <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Member since</span><span>{formatDate(customer.createdAt)}</span></div>
        <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Last order</span><span>{formatDate(customer.lastOrderAt)}</span></div>
        {customer.totalSpent >= 25000 && (
          <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Segment</span><AdminBadge tone="accent">VIP</AdminBadge></div>
        )}
      </div>

      <Link href="/admin/orders" className="admin-btn admin-btn--secondary admin-btn--sm w-full justify-center">
        <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} /> View orders
      </Link>
    </div>
  );
}
