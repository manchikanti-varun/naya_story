"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Mail,
  RefreshCw,
  Search,
  ShoppingBag,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminToolbar } from "@/components/admin/ui/AdminToolbar";
import { CustomerDetailDrawer } from "@/components/admin/CustomerDetailDrawer";
import { cn } from "@/lib/cn";

type CustomerRow = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

type GuestBuyer = {
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

type CustomersResponse = {
  customers: CustomerRow[];
  guestBuyers: GuestBuyer[];
  summary: {
    registered: number;
    withOrders: number;
    guestOnly: number;
  };
};

type SortKey = "name" | "email" | "createdAt" | "orderCount" | "totalSpent" | "lastOrderAt";
type SortDir = "asc" | "desc";
type Tab = "registered" | "guest";

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={align === "right" ? "text-right" : "text-left"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] transition",
          align === "right" && "ml-auto",
          active ? "text-[var(--admin-ink)]" : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden />
      </button>
    </th>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("registered");
  const [sortKey, setSortKey] = useState<SortKey>("lastOrderAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<CustomersResponse>("/admin/customers", { token });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "email" ? "asc" : "desc");
    }
  };

  const needle = q.trim().toLowerCase();

  const registeredRows = useMemo(() => {
    const list = (data?.customers ?? []).filter(
      (c) =>
        !needle ||
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle),
    );
    const mult = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return mult * a.name.localeCompare(b.name);
        case "email":
          return mult * a.email.localeCompare(b.email);
        case "orderCount":
          return mult * (a.orderCount - b.orderCount);
        case "totalSpent":
          return mult * (a.totalSpent - b.totalSpent);
        case "createdAt":
          return mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "lastOrderAt":
        default: {
          const at = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
          const bt = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
          return mult * (at - bt);
        }
      }
    });
    return list;
  }, [data?.customers, needle, sortKey, sortDir]);

  const guestRows = useMemo(() => {
    return (data?.guestBuyers ?? []).filter((g) => !needle || g.email.toLowerCase().includes(needle));
  }, [data?.guestBuyers, needle]);

  const summary = data?.summary;

  return (
    <AdminPageLayout
      title="Customers"
      description="Registered accounts and order history."
      actions={
        <Link
          href="/admin/orders"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-ink)] shadow-sm hover:bg-[var(--admin-surface-raised)]"
        >
          <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.65} />
          View orders
        </Link>
      }
      toolbar={
        <AdminToolbar className="w-full flex-col gap-4 border-0 bg-transparent p-0 shadow-none sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]"
              strokeWidth={1.75}
            />
            <AdminInput
              className="!mt-0 pl-9"
              placeholder="Search name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--admin-border-strong)] px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-ink)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} strokeWidth={1.75} />
            Refresh
          </button>
          {needle ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--admin-border)] px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              Clear
            </button>
          ) : null}
        </AdminToolbar>
      }
    >
      {summary ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <AdminCard padding="md">
            <div className="flex items-start justify-between gap-2">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
                Registered accounts
              </p>
              <Users className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">
              {summary.registered}
            </p>
          </AdminCard>
          <AdminCard padding="md">
            <div className="flex items-start justify-between gap-2">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
                With orders
              </p>
              <ShoppingBag className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">
              {summary.withOrders}
            </p>
          </AdminCard>
          <AdminCard padding="md">
            <div className="flex items-start justify-between gap-2">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
                Guest-only buyers
              </p>
              <Mail className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">
              {summary.guestOnly}
            </p>
            <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Checked out without an account</p>
          </AdminCard>
        </section>
      ) : null}

      <nav className="flex gap-2 border-b border-[var(--admin-border)] pb-0">
        <button
          type="button"
          onClick={() => setTab("registered")}
          className={cn(
            "border-b-2 px-3 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition",
            tab === "registered"
              ? "border-[var(--admin-ink)] text-[var(--admin-ink)]"
              : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
          )}
        >
          Registered ({data?.customers.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab("guest")}
          className={cn(
            "border-b-2 px-3 py-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] transition",
            tab === "guest"
              ? "border-[var(--admin-ink)] text-[var(--admin-ink)]"
              : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
          )}
        >
          Guest checkouts ({data?.guestBuyers.length ?? 0})
        </button>
      </nav>

      {loading ? (
        <p className="py-12 text-center font-sans text-sm text-[var(--admin-muted)]">Loading customers…</p>
      ) : tab === "registered" ? (
        registeredRows.length === 0 ? (
          <AdminEmptyState
            title="No customers found"
            description={needle ? "Try another search." : "New registrations will appear here."}
            action={
              <span className="inline-flex items-center gap-2 font-sans text-sm text-[var(--admin-muted)]">
                <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                Customers sign up on the storefront
              </span>
            }
          />
        ) : (
          <AdminTable>
            <table className="admin-table">
              <thead>
                <tr>
                  <SortableHeader label="Customer" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Email" sortKey="email" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader
                    label="Orders"
                    sortKey="orderCount"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    align="right"
                  />
                  <SortableHeader
                    label="Lifetime value"
                    sortKey="totalSpent"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    align="right"
                  />
                  <SortableHeader
                    label="Last order"
                    sortKey="lastOrderAt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Joined"
                    sortKey="createdAt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {registeredRows.map((c) => (
                  <tr key={c._id} className="cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                    <td>
                      <p className="font-medium text-[var(--admin-ink)]">{c.name}</p>
                      <p className="font-sans text-[11px] text-[var(--admin-faint)]">Account</p>
                    </td>
                    <td className="text-[var(--admin-muted)]">{c.email}</td>
                    <td className="text-right tabular-nums">
                      {c.orderCount > 0 ? (
                        c.orderCount
                      ) : (
                        <span className="text-[var(--admin-faint)]">0</span>
                      )}
                    </td>
                    <td className="text-right font-medium tabular-nums">
                      {c.totalSpent > 0 ? `₹${c.totalSpent.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--admin-muted)]">
                      {formatDate(c.lastOrderAt)}
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--admin-muted)]">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        )
      ) : guestRows.length === 0 ? (
        <AdminEmptyState
          title="No guest checkouts"
          description="Guest buyers who never created an account appear here."
        />
      ) : (
        <AdminTable>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Total spent</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {guestRows.map((g) => (
                <tr key={g.email}>
                  <td>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{g.email}</p>
                      <AdminBadge tone="neutral">Guest</AdminBadge>
                    </div>
                  </td>
                  <td className="text-right tabular-nums">{g.orderCount}</td>
                  <td className="text-right font-medium tabular-nums">
                    ₹{g.totalSpent.toLocaleString("en-IN")}
                  </td>
                  <td className="text-sm text-[var(--admin-muted)]">{formatDate(g.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTable>
      )}

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
    </AdminPageLayout>
  );
}
