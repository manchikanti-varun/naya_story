"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  CircleDollarSign,
  ClipboardList,
  Home,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminMetricCard } from "@/components/admin/ui/AdminMetricCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { formatOrderStatus, orderStatusTone } from "@/lib/admin/order-utils";
type Overview = {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  pendingOrdersCount: number;
  recentOrders: {
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    guestEmail?: string;
  }[];
  salesTrend: { _id: string; revenue: number }[];
  lowStock: {
    name: string;
    slug: string;
    variants: { sku: string; stock: number }[];
  }[];
  outOfStockCount: number;
};

import { websitePagesUrl } from "@/lib/admin/website-pages";

const QUICK_LINKS = [
  { href: websitePagesUrl("homepage"), label: "Homepage", icon: Home },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<Overview>("/admin/overview", { token });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading overview…</p>;
  }

  if (!data) {
    return (
      <AdminPageLayout eyebrow="Dashboard" title="Overview" description="Could not load dashboard data.">
        <AdminCard padding="md">
          <p className="font-sans text-sm text-[var(--admin-muted)]">Check your connection and try refreshing.</p>
          <AdminButton variant="primary" size="sm" className="mt-4" onClick={() => void load()}>
            Retry
          </AdminButton>
        </AdminCard>
      </AdminPageLayout>
    );
  }

  const stockAttention =
    (data.outOfStockCount ?? 0) > 0 || (data.lowStock?.length ?? 0) > 0;

  return (
    <AdminPageLayout
      eyebrow="Dashboard"
      title="Overview"
      description="Revenue, fulfilment queue, and recent activity. Manage your storefront under Website in the sidebar."
    >
      <section className="flex flex-wrap gap-2">
        {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="admin-quick-link"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.65} aria-hidden />
            {label}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Lifetime revenue"
          value={`₹${data.revenue.toLocaleString("en-IN")}`}
          icon={CircleDollarSign}
          href="/admin/analytics"
        />
        <AdminMetricCard
          label="Total orders"
          value={String(data.ordersCount)}
          icon={Package}
          href="/admin/orders"
        />
        <AdminMetricCard
          label="Customers"
          value={String(data.customersCount)}
          icon={Users}
          href="/admin/customers"
        />
        <AdminMetricCard
          label="Needs fulfilment"
          value={String(data.pendingOrdersCount)}
          icon={ClipboardList}
          href="/admin/orders"
          hint="Pending, confirmed, or packed"
          accent={data.pendingOrdersCount > 0}
        />
      </section>

      {stockAttention ? (
        <AdminCard
          elevated
          padding="md"
          className="border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-[var(--admin-surface)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900/80">
                Inventory alert
              </p>
              <p className="mt-1 font-sans text-sm text-amber-950/90">
                <span className="font-semibold tabular-nums">{data.outOfStockCount ?? 0}</span> out of stock ·{" "}
                <span className="font-semibold tabular-nums">{data.lowStock?.length ?? 0}</span> low stock
              </p>
            </div>
            <Link
              href="/admin/inventory"
              className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-[var(--admin-ink)] px-4 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-white hover:opacity-90 sm:self-auto"
            >
              Review inventory
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </AdminCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <AdminCard elevated className="lg:col-span-3" padding="md">
          <div className="mb-4">
            <h2 className="font-sans text-lg font-semibold text-[var(--admin-ink)]">Revenue trend</h2>
            <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">Paid orders, last 30 days</p>
          </div>
          <RevenueTrendChart data={data.salesTrend} />
        </AdminCard>

        <AdminCard elevated className="lg:col-span-2" padding="md">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-sans text-lg font-semibold text-[var(--admin-ink)]">Recent orders</h2>
              <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">Latest 8 orders</p>
            </div>
            <Link
              href="/admin/orders"
              className="shrink-0 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-accent)] hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="py-8 text-center font-sans text-sm text-[var(--admin-muted)]">No orders yet.</p>
          ) : (
            <AdminTable>
              <table className="admin-table text-sm">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <p className="font-medium tabular-nums">{o.orderNumber}</p>
                        <p className="mt-0.5 truncate font-sans text-[10px] text-[var(--admin-faint)]">
                          {o.guestEmail ??
                            new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                        </p>
                      </td>
                      <td>
                        <AdminBadge tone={orderStatusTone(o.status)}>{formatOrderStatus(o.status)}</AdminBadge>
                      </td>
                      <td className="text-right font-medium tabular-nums">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTable>
          )}
        </AdminCard>
      </div>
    </AdminPageLayout>
  );
}

const CHART_HEIGHT = 260;

function RevenueTrendChart({ data }: { data: { _id: string; revenue: number }[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data.length) {
    return (
      <p
        className="flex items-center justify-center font-sans text-sm text-[var(--admin-muted)]"
        style={{ height: CHART_HEIGHT }}
      >
        No revenue data for this period.
      </p>
    );
  }

  if (!mounted) {
    return (
      <div
        className="w-full animate-pulse rounded-lg bg-[var(--admin-surface-raised)]"
        style={{ height: CHART_HEIGHT }}
        aria-hidden
      />
    );
  }

  return (
    <div className="w-full min-w-0" style={{ height: CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="nayaSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a67c32" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#a67c32" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
          <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="var(--admin-faint)" />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--admin-faint)" />
          <Tooltip
            formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--admin-border)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#a67c32"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#nayaSales)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

