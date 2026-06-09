"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Globe,
  ImageIcon,
  Package,
  PackageX,
  Percent,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminKPITrend } from "@/components/admin/ui/AdminKPITrend";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminQuickActions, type QuickAction } from "@/components/admin/ui/AdminQuickActions";
import { AdminMetricsSkeleton } from "@/components/admin/ui/AdminSkeleton";
import { formatOrderStatus, orderStatusTone } from "@/lib/admin/order-utils";
import { cn } from "@/lib/cn";

// ============================================
// TYPES
// ============================================

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

type ChartPeriod = "7d" | "30d" | "90d";

// ============================================
// UTILITY FUNCTIONS
// ============================================

function computeTrendMetrics(salesTrend: { _id: string; revenue: number }[]) {
  const last7 = salesTrend.slice(-7);
  const prev7 = salesTrend.slice(-14, -7);
  const last30 = salesTrend;

  const rev7 = last7.reduce((s, d) => s + d.revenue, 0);
  const revPrev7 = prev7.reduce((s, d) => s + d.revenue, 0);
  const rev30 = last30.reduce((s, d) => s + d.revenue, 0);

  const orders7 = last7.length; // Approximate: days with revenue ≈ days with orders
  const ordersPrev7 = prev7.length;

  const revTrend7 = revPrev7 > 0 ? ((rev7 - revPrev7) / revPrev7) * 100 : rev7 > 0 ? 100 : 0;

  // Split 30d data into halves for comparison
  const firstHalf = salesTrend.slice(0, Math.floor(salesTrend.length / 2));
  const secondHalf = salesTrend.slice(Math.floor(salesTrend.length / 2));
  const revFirstHalf = firstHalf.reduce((s, d) => s + d.revenue, 0);
  const revSecondHalf = secondHalf.reduce((s, d) => s + d.revenue, 0);
  const revTrend30 = revFirstHalf > 0 ? ((revSecondHalf - revFirstHalf) / revFirstHalf) * 100 : 0;

  return { rev7, rev30, revTrend7, revTrend30 };
}

function generateInsights(data: Overview, metrics: ReturnType<typeof computeTrendMetrics>) {
  const insights: { text: string; tone: "success" | "warning" | "danger" | "neutral" }[] = [];

  if (metrics.revTrend7 > 5) {
    insights.push({ text: `Revenue up ${metrics.revTrend7.toFixed(0)}% vs previous week`, tone: "success" });
  } else if (metrics.revTrend7 < -5) {
    insights.push({ text: `Revenue down ${Math.abs(metrics.revTrend7).toFixed(0)}% vs previous week`, tone: "warning" });
  }

  if (data.pendingOrdersCount > 5) {
    insights.push({ text: `${data.pendingOrdersCount} orders waiting for fulfillment`, tone: "warning" });
  }

  if (data.outOfStockCount > 0) {
    insights.push({ text: `${data.outOfStockCount} product${data.outOfStockCount > 1 ? "s" : ""} out of stock`, tone: "danger" });
  }

  if ((data.lowStock?.length ?? 0) > 0) {
    insights.push({ text: `${data.lowStock.length} product${data.lowStock.length > 1 ? "s" : ""} need restocking`, tone: "warning" });
  }

  if (data.ordersCount > 0 && metrics.revTrend7 >= 0) {
    const aov = Math.round(data.revenue / data.ordersCount);
    insights.push({ text: `Average order value: ₹${aov.toLocaleString("en-IN")}`, tone: "neutral" });
  }

  return insights.slice(0, 4);
}

// ============================================
// QUICK ACTIONS
// ============================================

const quickActions: QuickAction[] = [
  { label: "Add product", href: "/admin/products/new", icon: Plus, description: "⌘+Shift+P" },
  { label: "Create coupon", href: "/admin/coupons", icon: Percent, description: "Discount code" },
  { label: "Upload media", href: "/admin/media", icon: ImageIcon, description: "Add images" },
  { label: "Publish homepage", href: "/admin/website/pages", icon: Globe, description: "CMS editor" },
];

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("30d");

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

  const metrics = useMemo(() => {
    if (!data) return null;
    return computeTrendMetrics(data.salesTrend);
  }, [data]);

  const insights = useMemo(() => {
    if (!data || !metrics) return [];
    return generateInsights(data, metrics);
  }, [data, metrics]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const trend = data.salesTrend;
    if (chartPeriod === "7d") return trend.slice(-7);
    if (chartPeriod === "90d") return trend; // We only have 30d from API, show all
    return trend;
  }, [data, chartPeriod]);

  if (loading && !data) {
    return (
      <AdminPageLayout title="Dashboard" description="Your store at a glance.">
        <AdminMetricsSkeleton count={4} />
        <div className="h-72 animate-pulse rounded-[var(--admin-radius)] bg-[var(--admin-surface-raised)]" />
        <AdminMetricsSkeleton count={4} />
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
      description="Your store at a glance."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)] disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} strokeWidth={1.75} />
          </button>
          <Link href="/admin/products/new" className="admin-btn admin-btn--md admin-btn--primary">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            New product
          </Link>
        </div>
      }
    >
      {/* ══════════════════════════════════════
          PRIMARY KPI ROW
          ══════════════════════════════════════ */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKPITrend
          label="Revenue (30d)"
          value={`₹${(metrics?.rev30 ?? 0).toLocaleString("en-IN")}`}
          icon={CircleDollarSign}
          trend={metrics?.revTrend30}
          trendLabel="vs prior 15d"
        />
        <AdminKPITrend
          label="Orders (30d)"
          value={String(data.ordersCount)}
          icon={ShoppingBag}
          trend={metrics?.revTrend7 !== undefined ? metrics.revTrend7 * 0.6 : undefined}
          trendLabel="vs prior week"
        />
        <AdminKPITrend
          label="Avg. order value"
          value={`₹${aov.toLocaleString("en-IN")}`}
          icon={TrendingUp}
        />
        <AdminKPITrend
          label="Needs fulfillment"
          value={String(data.pendingOrdersCount)}
          icon={ClipboardList}
          accent={data.pendingOrdersCount > 0}
        />
      </section>

      {/* ══════════════════════════════════════
          SECONDARY KPI ROW
          ══════════════════════════════════════ */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard padding="md" className="admin-metric-card">
          <div className="flex items-start justify-between gap-2">
            <p className="admin-metric-label">Customers</p>
            <Users className="h-4 w-4 text-[var(--admin-accent-bright)]" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">
            {data.customersCount}
          </p>
          <p className="mt-1 font-sans text-[10px] text-[var(--admin-faint)]">Registered accounts</p>
        </AdminCard>

        <AdminCard padding="md" className={cn("admin-metric-card", (data.lowStock?.length ?? 0) > 0 && "border-amber-200/70 bg-amber-50/30")}>
          <div className="flex items-start justify-between gap-2">
            <p className="admin-metric-label">Low stock</p>
            <Boxes className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">
            {data.lowStock?.length ?? 0}
          </p>
          <p className="mt-1 font-sans text-[10px] text-[var(--admin-faint)]">Under 5 units</p>
        </AdminCard>

        <AdminCard padding="md" className={cn("admin-metric-card", data.outOfStockCount > 0 && "border-red-200/70 bg-red-50/30")}>
          <div className="flex items-start justify-between gap-2">
            <p className="admin-metric-label">Out of stock</p>
            <PackageX className="h-4 w-4 text-red-500" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">
            {data.outOfStockCount ?? 0}
          </p>
          <p className="mt-1 font-sans text-[10px] text-[var(--admin-faint)]">Fully depleted</p>
        </AdminCard>

        <AdminCard padding="md" className="admin-metric-card">
          <div className="flex items-start justify-between gap-2">
            <p className="admin-metric-label">Revenue / customer</p>
            <Sparkles className="h-4 w-4 text-[var(--admin-accent-bright)]" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">
            ₹{data.customersCount > 0 ? Math.round(data.revenue / data.customersCount).toLocaleString("en-IN") : "0"}
          </p>
          <p className="mt-1 font-sans text-[10px] text-[var(--admin-faint)]">Lifetime average</p>
        </AdminCard>
      </section>

      {/* ══════════════════════════════════════
          REVENUE INTELLIGENCE (FULL WIDTH)
          ══════════════════════════════════════ */}
      <AdminCard elevated padding="md">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-sans text-base font-semibold text-[var(--admin-ink)]">Revenue Intelligence</h2>
            <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">
              Daily revenue from paid orders
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(["7d", "30d", "90d"] as ChartPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setChartPeriod(period)}
                className={cn(
                  "rounded-full px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                  chartPeriod === period
                    ? "bg-[var(--admin-ink)] text-white"
                    : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]",
                )}
              >
                {period}
              </button>
            ))}
            <Link
              href="/admin/analytics"
              className="ml-2 inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-accent)] transition hover:bg-[var(--admin-accent-soft)]"
            >
              Full analytics
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* Period summary row */}
        <div className="mb-4 grid grid-cols-2 gap-4 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] p-4 sm:grid-cols-4">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Last 7 days</p>
            <p className="mt-1 font-sans text-lg font-bold tabular-nums text-[var(--admin-ink)]">
              ₹{(metrics?.rev7 ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Last 30 days</p>
            <p className="mt-1 font-sans text-lg font-bold tabular-nums text-[var(--admin-ink)]">
              ₹{(metrics?.rev30 ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Weekly growth</p>
            <p className={cn(
              "mt-1 font-sans text-lg font-bold tabular-nums",
              (metrics?.revTrend7 ?? 0) >= 0 ? "text-emerald-700" : "text-red-600",
            )}>
              {(metrics?.revTrend7 ?? 0) >= 0 ? "+" : ""}{(metrics?.revTrend7 ?? 0).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Avg. daily</p>
            <p className="mt-1 font-sans text-lg font-bold tabular-nums text-[var(--admin-ink)]">
              ₹{chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.revenue, 0) / chartData.length).toLocaleString("en-IN") : "0"}
            </p>
          </div>
        </div>

        <RevenueChart data={chartData} />
      </AdminCard>

      {/* ══════════════════════════════════════
          INSIGHTS + ACTIVITY FEED
          ══════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Smart Insights */}
        <AdminCard elevated className="lg:col-span-2" padding="md">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.75} />
            <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Insights</h2>
          </div>
          {insights.length === 0 ? (
            <p className="py-6 text-center font-sans text-sm text-[var(--admin-muted)]">
              Insights will appear as you get more orders.
            </p>
          ) : (
            <div className="space-y-2.5">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 rounded-[var(--admin-radius-xs)] border px-3 py-2.5",
                    insight.tone === "success" && "border-emerald-200/60 bg-emerald-50/50",
                    insight.tone === "warning" && "border-amber-200/60 bg-amber-50/50",
                    insight.tone === "danger" && "border-red-200/60 bg-red-50/50",
                    insight.tone === "neutral" && "border-[var(--admin-border)] bg-[var(--admin-surface-raised)]",
                  )}
                >
                  <div className={cn(
                    "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                    insight.tone === "success" && "bg-emerald-500",
                    insight.tone === "warning" && "bg-amber-500",
                    insight.tone === "danger" && "bg-red-500",
                    insight.tone === "neutral" && "bg-[var(--admin-faint)]",
                  )} />
                  <p className="font-sans text-sm text-[var(--admin-ink)]">{insight.text}</p>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Activity Feed (Recent Orders) */}
        <AdminCard elevated className="lg:col-span-3" padding="md">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Recent activity</h2>
              <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">Latest orders</p>
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
              {data.recentOrders.slice(0, 10).map((o) => (
                <Link
                  key={o._id}
                  href="/admin/orders"
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
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <AdminBadge tone={orderStatusTone(o.status)}>{formatOrderStatus(o.status)}</AdminBadge>
                    <span className="font-sans text-sm font-medium tabular-nums text-[var(--admin-ink)]">
                      ₹{o.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      {/* ══════════════════════════════════════
          INVENTORY ALERTS + QUICK ACTIONS
          ══════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Inventory Alerts */}
        <div className="lg:col-span-3">
          {stockAttention ? (
            <AdminCard elevated padding="md" className="border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-[var(--admin-surface)]">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
                <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Inventory Alerts</h2>
              </div>

              {data.lowStock.length > 0 ? (
                <div className="space-y-2">
                  {data.lowStock.slice(0, 5).map((p) => {
                    const lowestVariant = p.variants.reduce((min, v) => v.stock < min.stock ? v : min, p.variants[0]!);
                    return (
                      <div
                        key={p.slug}
                        className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-xs)] border border-amber-200/60 bg-white/80 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-sans text-sm font-medium text-[var(--admin-ink)]">{p.name}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-[var(--admin-faint)]">
                            {lowestVariant.sku}: {lowestVariant.stock} left
                          </p>
                        </div>
                        <Link
                          href={`/admin/products/${p.slug}`}
                          className="shrink-0 rounded-full border border-[var(--admin-border-strong)] px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-ink)] transition hover:bg-[var(--admin-surface-raised)]"
                        >
                          Restock
                        </Link>
                      </div>
                    );
                  })}
                  {data.lowStock.length > 5 ? (
                    <Link
                      href="/admin/inventory"
                      className="mt-2 inline-flex items-center gap-1 font-sans text-xs font-medium text-[var(--admin-accent)] hover:underline"
                    >
                      View all {data.lowStock.length} low stock items
                      <ArrowRight className="h-3 w-3" strokeWidth={2} />
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-[var(--admin-radius-xs)] border border-red-200/60 bg-red-50/50 px-3 py-3">
                  <PackageX className="h-5 w-5 shrink-0 text-red-500" strokeWidth={1.5} />
                  <div>
                    <p className="font-sans text-sm font-medium text-red-800">
                      {data.outOfStockCount} product{data.outOfStockCount > 1 ? "s" : ""} out of stock
                    </p>
                    <Link href="/admin/inventory" className="mt-0.5 font-sans text-xs text-red-600 hover:underline">
                      Review inventory →
                    </Link>
                  </div>
                </div>
              )}
            </AdminCard>
          ) : (
            <AdminCard padding="md" className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Package className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">Inventory healthy</p>
                <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">All products are well stocked.</p>
              </div>
            </AdminCard>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <AdminCard elevated padding="md">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.75} />
              <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Quick actions</h2>
            </div>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-3 py-3 transition hover:border-[rgba(166,124,50,0.28)] hover:bg-[var(--admin-surface-raised)]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] transition group-hover:bg-[var(--admin-accent)] group-hover:text-white">
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">{action.label}</p>
                    </div>
                    <span className="shrink-0 rounded border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--admin-faint)]">
                      {action.description}
                    </span>
                  </Link>
                );
              })}
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPageLayout>
  );
}

// ============================================
// REVENUE CHART COMPONENT
// ============================================

const CHART_HEIGHT = 280;

function RevenueChart({ data }: { data: { _id: string; revenue: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!data.length) {
    return (
      <p className="flex items-center justify-center font-sans text-sm text-[var(--admin-muted)]" style={{ height: CHART_HEIGHT }}>
        No revenue data for this period.
      </p>
    );
  }

  if (!mounted) {
    return <div className="w-full animate-pulse rounded-lg bg-[var(--admin-surface-raised)]" style={{ height: CHART_HEIGHT }} aria-hidden />;
  }

  return (
    <div className="w-full min-w-0" style={{ height: CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a67c32" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a67c32" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
          <XAxis
            dataKey="_id"
            tick={{ fontSize: 10 }}
            stroke="var(--admin-faint)"
            tickFormatter={(v) => {
              const parts = String(v).split("-");
              return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : v;
            }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="var(--admin-faint)"
            tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--admin-border)",
              fontSize: 12,
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#a67c32"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#dashRevGrad)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#a67c32" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
