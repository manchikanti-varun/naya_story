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
  ArrowUpRight,
  CircleDollarSign,
  ClipboardList,
  ImageIcon,
  Package,
  Percent,
  Plus,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminMetricCard } from "@/components/admin/ui/AdminMetricCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminQuickActions, type QuickAction } from "@/components/admin/ui/AdminQuickActions";
import { AdminMetricsSkeleton } from "@/components/admin/ui/AdminSkeleton";
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

const quickActions: QuickAction[] = [
  {
    label: "Add product",
    href: "/admin/products/new",
    icon: Plus,
    description: "Create a new catalog item",
  },
  {
    label: "Create coupon",
    href: "/admin/coupons",
    icon: Percent,
    description: "Set up a discount code",
  },
  {
    label: "Upload media",
    href: "/admin/media",
    icon: ImageIcon,
    description: "Add images to library",
  },
  {
    label: "View analytics",
    href: "/admin/analytics",
    icon: TrendingUp,
    description: "Revenue & performance",
  },
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
    return (
      <AdminPageLayout title="Dashboard" description="Sales, orders, and stock at a glance.">
        <AdminMetricsSkeleton />
      </AdminPageLayout>
    );
  }

  if (!data) {
    return (
      <AdminPageLayout title="Dashboard" description="Could not load dashboard data.">
        <AdminCard padding="md">
          <p className="font-sans text-sm text-[var(--admin-muted)]">Check your connection and try refreshing.</p>
          <AdminButton variant="primary" size="sm" className="mt-4" onClick={() => void load()}>
            Retry
          </AdminButton>
        </AdminCard>
      </AdminPageLayout>
    );
  }

  const aov = data.ordersCount === 0 ? 0 : Math.round(data.revenue / data.ordersCount);
  const stockAttention = (data.outOfStockCount ?? 0) > 0 || (data.lowStock?.length ?? 0) > 0;

  return (
    <AdminPageLayout
      title="Dashboard"
      description="Sales, orders, and stock at a glance."
      actions={
        <Link href="/admin/products/new" className="admin-btn admin-btn--md admin-btn--primary">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          New product
        </Link>
      }
    >
      {/* KPI Metrics */}
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
          hint="Pending · confirmed · packed"
          accent={data.pendingOrdersCount > 0}
        />
      </section>

      {/* Secondary metrics row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <AdminCard padding="md">
          <p className="admin-metric-label">Avg. order value</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">
            ₹{aov.toLocaleString("en-IN")}
          </p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="admin-metric-label">Low stock items</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">
            {data.lowStock?.length ?? 0}
          </p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Variants under 5 units</p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="admin-metric-label">Out of stock</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">
            {data.outOfStockCount ?? 0}
          </p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Products fully depleted</p>
        </AdminCard>
      </section>

      {/* Inventory alert */}
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
              className="admin-btn admin-btn--md admin-btn--primary self-start sm:self-auto"
            >
              Review inventory
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </AdminCard>
      ) : null}

      {/* Charts and Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-5">
        <AdminCard elevated className="lg:col-span-3" padding="md">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-sans text-base font-semibold text-[var(--admin-ink)]">Revenue trend</h2>
              <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">Paid orders, last 30 days</p>
            </div>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-accent)] hover:underline"
            >
              Details
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          </div>
          <RevenueTrendChart data={data.salesTrend} />
        </AdminCard>

        <AdminCard elevated className="lg:col-span-2" padding="md">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-sans text-base font-semibold text-[var(--admin-ink)]">Recent orders</h2>
              <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">Latest 8 orders</p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-accent)] hover:underline"
            >
              View all
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="py-8 text-center font-sans text-sm text-[var(--admin-muted)]">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map((o) => (
                <div
                  key={o._id}
                  className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-3 py-2.5 transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-raised)]"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-medium tabular-nums text-[var(--admin-ink)]">
                      {o.orderNumber}
                    </p>
                    <p className="mt-0.5 truncate font-sans text-[10px] text-[var(--admin-faint)]">
                      {o.guestEmail ??
                        new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <AdminBadge tone={orderStatusTone(o.status)}>{formatOrderStatus(o.status)}</AdminBadge>
                    <span className="font-sans text-sm font-medium tabular-nums text-[var(--admin-ink)]">
                      ₹{o.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">Quick actions</h2>
        <AdminQuickActions actions={quickActions} />
      </section>
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
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(8px)",
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
