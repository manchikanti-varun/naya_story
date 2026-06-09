"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Package,
  PackageX,
  Percent,
  RefreshCw,
  ShoppingBag,
  Tag,
  TrendingDown,
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
import { AdminMetricsSkeleton } from "@/components/admin/ui/AdminSkeleton";
import { cn } from "@/lib/cn";

// ============================================
// TYPES
// ============================================

type Overview = {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  pendingOrdersCount: number;
  topProducts: { _id: string; units: number; revenue: number }[];
  lowStock: { name: string; slug: string; variants: { sku: string; stock: number }[] }[];
  outOfStockCount: number;
  recentOrders: { _id: string; orderNumber: string; status: string; total: number; createdAt: string }[];
  salesTrend: { _id: string; revenue: number }[];
};

type AnalyticsTab = "revenue" | "products" | "customers" | "inventory" | "marketing";
type DateRange = "7d" | "30d" | "90d" | "365d";

// ============================================
// UTILITIES
// ============================================

function sliceTrend(data: { _id: string; revenue: number }[], range: DateRange) {
  switch (range) {
    case "7d": return data.slice(-7);
    case "30d": return data;
    case "90d": return data;
    case "365d": return data;
  }
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatCurrency(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

function formatDate(d: string) {
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return d;
}

const CHART_HEIGHT = 300;

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AnalyticsTab>("revenue");
  const [range, setRange] = useState<DateRange>("30d");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<Overview>("/admin/overview", { token });
      setData(res);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => {
    if (!data) return null;
    const trend = data.salesTrend;
    const chartData = sliceTrend(trend, range);
    const rev = chartData.reduce((s, d) => s + d.revenue, 0);
    const half = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, half).reduce((s, d) => s + d.revenue, 0);
    const secondHalf = chartData.slice(half).reduce((s, d) => s + d.revenue, 0);
    const revTrend = calcTrend(secondHalf, firstHalf);
    const last7 = trend.slice(-7).reduce((s, d) => s + d.revenue, 0);
    const prev7 = trend.slice(-14, -7).reduce((s, d) => s + d.revenue, 0);
    const weeklyTrend = calcTrend(last7, prev7);
    const aov = data.ordersCount === 0 ? 0 : Math.round(data.revenue / data.ordersCount);
    const avgDaily = chartData.length > 0 ? Math.round(rev / chartData.length) : 0;
    const ordersPerCustomer = data.customersCount > 0 ? (data.ordersCount / data.customersCount).toFixed(1) : "0";
    const revenuePerCustomer = data.customersCount > 0 ? Math.round(data.revenue / data.customersCount) : 0;
    return { chartData, rev, revTrend, last7, prev7, weeklyTrend, aov, avgDaily, ordersPerCustomer, revenuePerCustomer };
  }, [data, range]);

  if (loading && !data) {
    return (
      <AdminPageLayout title="Analytics" description="Revenue, products, and performance insights.">
        <AdminMetricsSkeleton count={4} />
        <div className="h-80 animate-pulse rounded-[var(--admin-radius)] bg-[var(--admin-surface-raised)]" />
      </AdminPageLayout>
    );
  }

  if (!data) {
    return (
      <AdminPageLayout title="Analytics" description="Could not load analytics.">
        <AdminCard padding="md">
          <p className="text-sm text-[var(--admin-muted)]">Check connection and retry.</p>
          <AdminButton variant="primary" size="sm" className="mt-3" onClick={() => void load()}>Retry</AdminButton>
        </AdminCard>
      </AdminPageLayout>
    );
  }

  const tabs: { id: AnalyticsTab; label: string; icon: typeof BarChart3 }[] = [
    { id: "revenue", label: "Revenue", icon: CircleDollarSign },
    { id: "products", label: "Products", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "marketing", label: "Marketing", icon: Tag },
  ];

  return (
    <AdminPageLayout
      title="Analytics"
      description="Revenue, products, and performance insights."
      actions={
        <button type="button" onClick={() => void load()} disabled={loading}
          className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] disabled:opacity-50" aria-label="Refresh">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} strokeWidth={1.75} />
        </button>
      }
    >
      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--admin-border)] pb-0">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 font-sans text-xs font-semibold transition",
                tab === t.id
                  ? "border-[var(--admin-ink)] text-[var(--admin-ink)]"
                  : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
              )}>
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "revenue" && <RevenueTab data={data} metrics={metrics!} range={range} setRange={setRange} mounted={mounted} />}
      {tab === "products" && <ProductsTab data={data} />}
      {tab === "customers" && <CustomersTab data={data} metrics={metrics!} />}
      {tab === "inventory" && <InventoryTab data={data} />}
      {tab === "marketing" && <MarketingTab data={data} />}
    </AdminPageLayout>
  );
}

// ============================================
// TAB: REVENUE
// ============================================

function RevenueTab({ data, metrics, range, setRange, mounted }: {
  data: Overview;
  metrics: NonNullable<ReturnType<typeof Object>>;
  range: DateRange;
  setRange: (r: DateRange) => void;
  mounted: boolean;
}) {
  const m = metrics as { chartData: { _id: string; revenue: number }[]; rev: number; revTrend: number; last7: number; weeklyTrend: number; aov: number; avgDaily: number };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKPITrend label={`Revenue (${range})`} value={formatCurrency(m.rev)} icon={CircleDollarSign} trend={m.revTrend} trendLabel="vs prior half" />
        <AdminKPITrend label="Orders" value={String(data.ordersCount)} icon={ShoppingBag} />
        <AdminKPITrend label="Avg. Order Value" value={formatCurrency(m.aov)} icon={TrendingUp} />
        <AdminKPITrend label="Weekly Growth" value={`${m.weeklyTrend >= 0 ? "+" : ""}${m.weeklyTrend.toFixed(1)}%`} icon={m.weeklyTrend >= 0 ? TrendingUp : TrendingDown} trend={m.weeklyTrend} trendLabel="vs prev 7d" />
      </section>

      {/* Date Range Picker */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["7d", "30d", "90d", "365d"] as DateRange[]).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                range === r ? "bg-[var(--admin-ink)] text-white" : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)]",
              )}>
              {r}
            </button>
          ))}
        </div>
        <p className="font-sans text-xs text-[var(--admin-faint)]">Avg. daily: {formatCurrency(m.avgDaily)}</p>
      </div>

      {/* Revenue Chart */}
      <AdminCard elevated padding="md">
        <div className="mb-4">
          <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Revenue Trend</h2>
          <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">Daily paid order revenue</p>
        </div>
        <div className="w-full" style={{ height: CHART_HEIGHT }}>
          {mounted && m.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
              <AreaChart data={m.chartData}>
                <defs>
                  <linearGradient id="aRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a67c32" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a67c32" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="var(--admin-faint)" tickFormatter={formatDate} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--admin-faint)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid var(--admin-border)", fontSize: 12, background: "rgba(255,255,255,0.96)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#a67c32" strokeWidth={2.5} fillOpacity={1} fill="url(#aRevGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#a67c32" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--admin-muted)]">No data for this period</div>
          )}
        </div>
      </AdminCard>

      {/* Daily Pace */}
      <AdminCard elevated padding="md">
        <div className="mb-4">
          <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Daily Pace</h2>
          <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">Compare daily performance</p>
        </div>
        <div className="w-full" style={{ height: 220 }}>
          {mounted && m.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220} debounce={50}>
              <BarChart data={m.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="var(--admin-faint)" tickFormatter={formatDate} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--admin-faint)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid var(--admin-border)", fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#a67c32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </AdminCard>

      {/* Period Comparison */}
      <section className="grid gap-4 sm:grid-cols-3">
        <AdminCard padding="md">
          <p className="admin-metric-label">Last 7 days</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">{formatCurrency(m.last7)}</p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Revenue from paid orders</p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="admin-metric-label">Pending fulfillment</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">{data.pendingOrdersCount}</p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Orders needing action</p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="admin-metric-label">Avg. daily revenue</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">{formatCurrency(m.avgDaily)}</p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Based on selected period</p>
        </AdminCard>
      </section>
    </div>
  );
}

// ============================================
// TAB: PRODUCTS
// ============================================

function ProductsTab({ data }: { data: Overview }) {
  const topProducts = data.topProducts ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <AdminCard padding="md">
          <p className="admin-metric-label">Top products tracked</p>
          <p className="admin-metric-value mt-2 text-2xl tabular-nums text-[var(--admin-ink)]">{topProducts.length}</p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="admin-metric-label">Total units sold (top 5)</p>
          <p className="admin-metric-value mt-2 text-2xl tabular-nums text-[var(--admin-ink)]">
            {topProducts.reduce((s, p) => s + p.units, 0)}
          </p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="admin-metric-label">Top 5 revenue</p>
          <p className="admin-metric-value mt-2 text-2xl tabular-nums text-[var(--admin-ink)]">
            {formatCurrency(topProducts.reduce((s, p) => s + p.revenue, 0))}
          </p>
        </AdminCard>
      </section>

      <AdminCard elevated padding="md">
        <h2 className="mb-4 font-sans text-sm font-semibold text-[var(--admin-ink)]">Top Products by Revenue</h2>
        {topProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--admin-muted)]">No product data yet. Orders generate product analytics.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, idx) => {
              const maxRev = topProducts[0]?.revenue ?? 1;
              const pct = Math.round((p.revenue / maxRev) * 100);
              return (
                <div key={p._id || idx} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] font-sans text-[10px] font-bold text-[var(--admin-accent)]">{idx + 1}</span>
                      <span className="font-sans text-sm font-medium text-[var(--admin-ink)] truncate">{p._id ? `Product ${String(p._id).slice(-6)}` : `#${idx + 1}`}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-sans text-xs tabular-nums text-[var(--admin-muted)]">{p.units} units</span>
                      <span className="font-sans text-sm font-semibold tabular-nums text-[var(--admin-ink)]">{formatCurrency(p.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--admin-surface-raised)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--admin-accent)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

// ============================================
// TAB: CUSTOMERS
// ============================================

function CustomersTab({ data, metrics }: { data: Overview; metrics: { ordersPerCustomer: string; revenuePerCustomer: number; aov: number } }) {
  const m = metrics as { ordersPerCustomer: string; revenuePerCustomer: number; aov: number };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKPITrend label="Total Customers" value={String(data.customersCount)} icon={Users} />
        <AdminCard padding="md" className="admin-metric-card">
          <p className="admin-metric-label">Avg. Lifetime Value</p>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">{formatCurrency(m.revenuePerCustomer)}</p>
        </AdminCard>
        <AdminCard padding="md" className="admin-metric-card">
          <p className="admin-metric-label">Orders / Customer</p>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">{m.ordersPerCustomer}</p>
        </AdminCard>
        <AdminCard padding="md" className="admin-metric-card">
          <p className="admin-metric-label">Avg. Order Value</p>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">{formatCurrency(m.aov)}</p>
        </AdminCard>
      </section>

      <AdminCard elevated padding="md">
        <h2 className="mb-4 font-sans text-sm font-semibold text-[var(--admin-ink)]">Customer Insights</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-[var(--admin-faint)]">Repeat Purchase Rate</p>
            <p className="mt-2 font-sans text-2xl font-bold tabular-nums text-[var(--admin-ink)]">
              {data.customersCount > 0 && data.ordersCount > data.customersCount
                ? `${Math.round(((data.ordersCount - data.customersCount) / data.ordersCount) * 100)}%`
                : "—"}
            </p>
            <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Orders from returning customers</p>
          </div>
          <div className="rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] p-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-[var(--admin-faint)]">Customer:Order Ratio</p>
            <p className="mt-2 font-sans text-2xl font-bold tabular-nums text-[var(--admin-ink)]">1:{m.ordersPerCustomer}</p>
            <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Average orders per customer</p>
          </div>
        </div>
      </AdminCard>

      <AdminCard padding="md">
        <p className="text-xs text-[var(--admin-muted)]">
          Detailed cohort analysis, retention curves, and customer segments are available in the{" "}
          <Link href="/admin/customers" className="font-medium text-[var(--admin-accent)] hover:underline">Customer CRM</Link>.
        </p>
      </AdminCard>
    </div>
  );
}

// ============================================
// TAB: INVENTORY
// ============================================

function InventoryTab({ data }: { data: Overview }) {
  const lowStock = data.lowStock ?? [];
  const totalLowStockUnits = lowStock.reduce((s, p) => s + p.variants.reduce((vs, v) => vs + v.stock, 0), 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <AdminCard padding="md" className={cn("admin-metric-card", data.outOfStockCount > 0 && "border-red-200/70 bg-red-50/30")}>
          <div className="flex items-start justify-between">
            <p className="admin-metric-label">Out of Stock</p>
            <PackageX className="h-4 w-4 text-red-500" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">{data.outOfStockCount}</p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Products fully depleted</p>
        </AdminCard>
        <AdminCard padding="md" className={cn("admin-metric-card", lowStock.length > 0 && "border-amber-200/70 bg-amber-50/30")}>
          <div className="flex items-start justify-between">
            <p className="admin-metric-label">Low Stock</p>
            <AlertTriangle className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">{lowStock.length}</p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Products under 5 units</p>
        </AdminCard>
        <AdminCard padding="md" className="admin-metric-card">
          <div className="flex items-start justify-between">
            <p className="admin-metric-label">Low Stock Units</p>
            <Boxes className="h-4 w-4 text-[var(--admin-accent-bright)]" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">{totalLowStockUnits}</p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Total units remaining</p>
        </AdminCard>
      </section>

      {lowStock.length > 0 ? (
        <AdminCard elevated padding="md">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
            <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Low Stock Products</h2>
          </div>
          <div className="space-y-2.5">
            {lowStock.map((p) => {
              const lowestVariant = p.variants.reduce((min, v) => v.stock < min.stock ? v : min, p.variants[0]!);
              const totalUnits = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <div key={p.slug} className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-[var(--admin-ink)]">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[var(--admin-faint)]">
                      Lowest: {lowestVariant.sku} ({lowestVariant.stock} left) · Total: {totalUnits} units
                    </p>
                  </div>
                  <Link href={`/admin/products/${p.slug}`}
                    className="shrink-0 rounded-full border border-[var(--admin-border-strong)] px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-ink)] hover:bg-[var(--admin-surface-raised)]">
                    Restock
                  </Link>
                </div>
              );
            })}
          </div>
        </AdminCard>
      ) : (
        <AdminCard padding="md" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Package className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">All products well stocked</p>
            <p className="mt-0.5 text-xs text-[var(--admin-muted)]">No inventory alerts at this time.</p>
          </div>
        </AdminCard>
      )}
    </div>
  );
}

// ============================================
// TAB: MARKETING
// ============================================

function MarketingTab({ data }: { data: Overview }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard padding="md" className="admin-metric-card">
          <div className="flex items-start justify-between">
            <p className="admin-metric-label">Total Orders</p>
            <ShoppingBag className="h-4 w-4 text-[var(--admin-accent-bright)]" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">{data.ordersCount}</p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Lifetime order count</p>
        </AdminCard>
        <AdminCard padding="md" className="admin-metric-card">
          <div className="flex items-start justify-between">
            <p className="admin-metric-label">Avg. Order Value</p>
            <Zap className="h-4 w-4 text-[var(--admin-accent-bright)]" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">
            {data.ordersCount > 0 ? formatCurrency(Math.round(data.revenue / data.ordersCount)) : "—"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Revenue ÷ orders</p>
        </AdminCard>
        <AdminCard padding="md" className="admin-metric-card">
          <div className="flex items-start justify-between">
            <p className="admin-metric-label">Revenue</p>
            <CircleDollarSign className="h-4 w-4 text-[var(--admin-accent-bright)]" strokeWidth={1.5} />
          </div>
          <p className="admin-metric-value mt-3 text-2xl tabular-nums text-[var(--admin-ink)]">{formatCurrency(data.revenue)}</p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">Net lifetime revenue</p>
        </AdminCard>
      </section>

      <AdminCard elevated padding="md">
        <div className="mb-4 flex items-center gap-2">
          <Percent className="h-4 w-4 text-[var(--admin-accent)]" strokeWidth={1.75} />
          <h2 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Coupon & Promotions</h2>
        </div>
        <div className="rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] p-4">
          <p className="font-sans text-sm text-[var(--admin-muted)]">
            Coupon usage analytics will be available when orders with discount codes are processed. Manage coupons in the{" "}
            <Link href="/admin/coupons" className="font-medium text-[var(--admin-accent)] hover:underline">Coupons section</Link>.
          </p>
        </div>
      </AdminCard>

      <AdminCard padding="md">
        <h3 className="mb-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">Marketing Channels</h3>
        <p className="text-xs text-[var(--admin-muted)]">
          Campaign tracking, newsletter growth metrics, and channel attribution will be populated as integrations (Mailchimp, Klaviyo, UTM tracking) are connected.
        </p>
      </AdminCard>
    </div>
  );
}
