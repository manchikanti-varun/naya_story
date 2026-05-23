"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import { ORDER_STATUSES } from "@/lib/constants";
import type { Order } from "@/types";
import {
  formatOrderStatus,
  orderCustomerLabel,
  orderItemCount,
  orderItemsPreview,
  orderStatusTone,
} from "@/lib/admin/order-utils";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminToolbar } from "@/components/admin/ui/AdminToolbar";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 20;

type SortKey = "orderNumber" | "createdAt" | "status" | "total" | "customer" | "items";
type SortDir = "asc" | "desc";

function matchesSearch(o: Order, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    o.orderNumber.toLowerCase().includes(needle) ||
    (o.guestEmail?.toLowerCase().includes(needle) ?? false) ||
    (o.trackingNumber?.toLowerCase().includes(needle) ?? false) ||
    o.shippingAddress?.city?.toLowerCase().includes(needle) ||
    o.shippingAddress?.postalCode?.toLowerCase().includes(needle) ||
    o.status.toLowerCase().includes(needle)
  );
}

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

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ orders: Order[] }>("/orders", { token });
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "orderNumber" || key === "customer" ? "asc" : "desc");
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      return matchesSearch(o, q);
    });
  }, [orders, q, statusFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const mult = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "orderNumber":
          return mult * a.orderNumber.localeCompare(b.orderNumber);
        case "status":
          return mult * a.status.localeCompare(b.status);
        case "total":
          return mult * (a.total - b.total);
        case "customer":
          return mult * orderCustomerLabel(a).localeCompare(orderCustomerLabel(b));
        case "items":
          return mult * (orderItemCount(a) - orderItemCount(b));
        case "createdAt":
        default:
          return mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = Boolean(q.trim() || statusFilter);

  const stats = useMemo(() => {
    const pending = orders.filter((o) =>
      ["pending", "confirmed", "packed"].includes(o.status),
    ).length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const filteredTotal = sorted.reduce((s, o) => s + (o.status !== "cancelled" ? o.total : 0), 0);
    return { pending, shipped, filteredTotal };
  }, [orders, sorted]);

  return (
    <AdminPageLayout
      title="Orders"
      description="Search orders and update status or tracking."
      toolbar={
        <AdminToolbar className="w-full flex-col gap-4 border-0 bg-transparent p-0 shadow-none lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]"
              strokeWidth={1.75}
            />
            <AdminInput
              className="!mt-0 pl-9"
              placeholder="Search order #, email, tracking, city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">
            <select
              className="admin-input w-full sm:w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatOrderStatus(s)}
                </option>
              ))}
            </select>
            <select
              className="admin-input w-full sm:w-48"
              value={`${sortKey}-${sortDir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split("-") as [SortKey, SortDir];
                setSortKey(key);
                setSortDir(dir);
              }}
              aria-label="Sort orders"
            >
              <option value="createdAt-desc">Newest first</option>
              <option value="createdAt-asc">Oldest first</option>
              <option value="total-desc">Highest total</option>
              <option value="total-asc">Lowest total</option>
              <option value="orderNumber-asc">Order # A–Z</option>
              <option value="orderNumber-desc">Order # Z–A</option>
              <option value="status-asc">Status A–Z</option>
            </select>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--admin-border-strong)] px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-ink)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} strokeWidth={1.75} />
              Refresh
            </button>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setStatusFilter("");
                }}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-[var(--admin-border)] px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                Clear
              </button>
            ) : null}
          </div>
        </AdminToolbar>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard padding="md">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
            In queue
          </p>
          <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">{stats.pending}</p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Pending · confirmed · packed</p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
            Shipped
          </p>
          <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">{stats.shipped}</p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Awaiting delivery</p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
            {hasFilters ? "Filtered total" : "All orders"}
          </p>
          <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">
            {sorted.length}
          </p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">
            {hasFilters ? "Matching filters" : "Lifetime count"}
          </p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
            {hasFilters ? "Filtered revenue" : "Listed revenue"}
          </p>
          <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">
            ₹{stats.filteredTotal.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Excludes cancelled</p>
        </AdminCard>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className={cn(
            "rounded-full px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] transition",
            !statusFilter
              ? "bg-[var(--admin-ink)] text-white"
              : "border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
          )}
        >
          All
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={cn(
              "rounded-full px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] transition",
              statusFilter === s
                ? "bg-[var(--admin-ink)] text-white"
                : "border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
            )}
          >
            {formatOrderStatus(s)}
          </button>
        ))}
      </div>

      <p className="font-sans text-xs text-[var(--admin-muted)]">
        {loading
          ? "Loading…"
          : `${sorted.length} order${sorted.length === 1 ? "" : "s"}${hasFilters ? " (filtered)" : ""}`}
        {!loading && sorted.length > PAGE_SIZE ? ` · Page ${safePage} of ${totalPages}` : null}
      </p>

      {!loading && sorted.length === 0 ? (
        <AdminEmptyState
          title={orders.length === 0 ? "No orders yet" : "No matching orders"}
          description={
            orders.length === 0
              ? "Orders will appear here when customers check out."
              : "Try a different search or clear filters."
          }
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setStatusFilter("");
                }}
                className="rounded-full bg-[var(--admin-ink)] px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-white"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <AdminCard padding="none" elevated className="overflow-hidden">
          <AdminTable responsiveHide="md">
            <table className="admin-table">
              <thead>
                <tr>
                  <SortableHeader
                    label="Order"
                    sortKey="orderNumber"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Date"
                    sortKey="createdAt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Customer"
                    sortKey="customer"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Items"
                    sortKey="items"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                  <th>Tracking</th>
                  <SortableHeader
                    label="Total"
                    sortKey="total"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={toggleSort}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[var(--admin-muted)]">
                      Loading orders…
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  pageRows.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <p className="font-medium tabular-nums text-[var(--admin-ink)]">{o.orderNumber}</p>
                        <p className="mt-0.5 max-w-[14rem] truncate font-sans text-[11px] text-[var(--admin-muted)]">
                          {orderItemsPreview(o)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap text-[var(--admin-muted)]">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="mt-0.5 block font-mono text-[10px] text-[var(--admin-faint)]">
                          {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="max-w-[12rem]">
                        <p className="truncate text-sm" title={orderCustomerLabel(o)}>
                          {orderCustomerLabel(o)}
                        </p>
                        {o.shippingAddress?.city ? (
                          <p className="mt-0.5 truncate font-sans text-[10px] text-[var(--admin-faint)]">
                            {o.shippingAddress.city}
                            {o.shippingAddress.state ? `, ${o.shippingAddress.state}` : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="tabular-nums text-[var(--admin-muted)]">{orderItemCount(o)}</td>
                      <td>
                        <select
                          className="admin-input w-full min-w-[9rem] py-1.5 text-xs"
                          value={o.status}
                          onChange={async (e) => {
                            if (!token) return;
                            await apiFetch(`/orders/${o._id}/status`, {
                              method: "PATCH",
                              token,
                              body: JSON.stringify({ status: e.target.value }),
                            });
                            publishStorefrontSettingsChanged();
                            await refresh();
                          }}
                          aria-label={`Change status for ${o.orderNumber}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {formatOrderStatus(s)}
                            </option>
                          ))}
                        </select>
                        <AdminBadge tone={orderStatusTone(o.status)} className="mt-1.5 w-fit">
                          {formatOrderStatus(o.status)}
                        </AdminBadge>
                      </td>
                      <td>
                        <InlineTracking order={o} token={token!} onSaved={refresh} />
                      </td>
                      <td className="text-right font-medium tabular-nums">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </AdminTable>
          </AdminCard>

          {!loading && sorted.length > PAGE_SIZE ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-4">
              <p className="font-sans text-xs text-[var(--admin-muted)]">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of{" "}
                {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg p-2 text-[var(--admin-muted)] hover:bg-black/[0.04] disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <span className="px-2 font-mono text-xs text-[var(--admin-muted)]">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg p-2 text-[var(--admin-muted)] hover:bg-black/[0.04] disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </AdminPageLayout>
  );
}

function InlineTracking({
  order,
  token,
  onSaved,
}: {
  order: Order;
  token: string;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(order.trackingNumber ?? "");

  useEffect(() => {
    setValue(order.trackingNumber ?? "");
  }, [order.trackingNumber]);

  return (
    <form
      className="flex min-w-[10rem] gap-1.5"
      onSubmit={async (e) => {
        e.preventDefault();
        await apiFetch(`/orders/${order._id}/status`, {
          method: "PATCH",
          token,
          body: JSON.stringify({ trackingNumber: value.trim() || undefined }),
        });
        publishStorefrontSettingsChanged();
        await onSaved();
      }}
    >
      <AdminInput
        className="!mt-0 min-w-0 flex-1 py-1.5 text-xs"
        placeholder="Tracking #"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="shrink-0 rounded-full border border-[var(--admin-border-strong)] px-2.5 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--admin-ink)] hover:bg-[var(--admin-surface-raised)]"
      >
        Save
      </button>
    </form>
  );
}
