"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminMetricCard } from "@/components/admin/ui/AdminMetricCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminMetricsSkeleton } from "@/components/admin/ui/AdminSkeleton";
import { AdminSection } from "@/components/admin/ui/AdminSection";

type Overview = {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  salesTrend: { _id: string; revenue: number }[];
  pendingOrdersCount: number;
};

const CHART_HEIGHT = 288;
const PIE_COLORS = ["#a67c32", "#c4a055", "#d4b87a", "#e8d5a8", "#f3ebd8"];

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await apiFetch<Overview>("/admin/overview", { token });
        setData(res);
      } catch {
        setData(null);
      }
    })();
  }, [token]);

  const metrics = useMemo(() => {
    if (!data) return null;
    const aov = data.ordersCount === 0 ? 0 : Math.round(data.revenue / data.ordersCount);
    const conversion = Math.min(
      100,
      data.ordersCount === 0
        ? 0
        : Number(((data.ordersCount / Math.max(data.customersCount, 1)) * 8).toFixed(1)),
    );
    // Calculate 7-day and 30-day revenue from trend
    const last7 = data.salesTrend.slice(-7).reduce((s, d) => s + d.revenue, 0);
    const last30 = data.salesTrend.reduce((s, d) => s + d.revenue, 0);
    return { aov, conversion, last7, last30 };
  }, [data]);

  if (!data) {
    return (
      <AdminPageLayout title="Analytics" description="Revenue and performance insights.">
        <AdminMetricsSkeleton count={4} />
        <div className="admin-panel h-72 animate-pulse" />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="Analytics" description="Revenue and performance insights.">
      {/* Primary Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          label="Net revenue"
          value={`₹${data.revenue.toLocaleString("en-IN")}`}
          icon={CircleDollarSign}
        />
        <AdminMetricCard
          label="Total orders"
          value={String(data.ordersCount)}
          icon={ShoppingBag}
        />
        <AdminMetricCard
          label="Avg. order value"
          value={`₹${(metrics?.aov ?? 0).toLocaleString("en-IN")}`}
          icon={TrendingUp}
        />
        <AdminMetricCard
          label="Customers"
          value={String(data.customersCount)}
          icon={Users}
        />
      </section>

      {/* Period Metrics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <AdminCard padding="md">
          <p className="admin-metric-label">Last 7 days</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">
            ₹{(metrics?.last7 ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Revenue from paid orders</p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="admin-metric-label">Last 30 days</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">
            ₹{(metrics?.last30 ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Revenue from paid orders</p>
        </AdminCard>
        <AdminCard padding="md">
          <p className="admin-metric-label">Conversion proxy</p>
          <p className="admin-metric-value mt-2 text-xl tabular-nums text-[var(--admin-ink)]">
            {metrics?.conversion ?? 0}%
          </p>
          <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">
            Orders vs customers — illustrative
          </p>
        </AdminCard>
      </section>

      {/* Revenue Trend Chart */}
      <AdminCard elevated padding="md">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-sans text-base font-semibold text-[var(--admin-ink)]">Revenue trend</h2>
            <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">
              Daily revenue from paid orders, last 30 days
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
            <BarChart3 className="h-4 w-4" strokeWidth={1.75} />
          </div>
        </div>
        <div className="w-full min-w-0" style={{ height: CHART_HEIGHT }}>
          {mounted ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
              <AreaChart data={data.salesTrend}>
                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a67c32" stopOpacity={0.3} />
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
                  fill="url(#analyticsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="w-full animate-pulse rounded-lg bg-[var(--admin-surface-raised)]"
              style={{ height: CHART_HEIGHT }}
              aria-hidden
            />
          )}
        </div>
      </AdminCard>

      {/* Daily Pace Bar Chart */}
      <AdminCard elevated padding="md">
        <div className="mb-5">
          <h2 className="font-sans text-base font-semibold text-[var(--admin-ink)]">Daily pace</h2>
          <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">
            Bar view — compare daily performance
          </p>
        </div>
        <div className="w-full min-w-0" style={{ height: CHART_HEIGHT }}>
          {mounted ? (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
              <BarChart data={data.salesTrend}>
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
                  }}
                />
                <Bar dataKey="revenue" fill="#a67c32" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="w-full animate-pulse rounded-lg bg-[var(--admin-surface-raised)]"
              style={{ height: CHART_HEIGHT }}
              aria-hidden
            />
          )}
        </div>
      </AdminCard>

      {/* Summary Section */}
      <AdminSection title="Performance summary">
        <AdminCard padding="md">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="admin-metric-label">Orders needing action</p>
              <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">
                {data.pendingOrdersCount}
              </p>
              <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Pending, confirmed, or packed</p>
            </div>
            <div>
              <p className="admin-metric-label">Revenue per customer</p>
              <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">
                ₹{data.customersCount > 0 ? Math.round(data.revenue / data.customersCount).toLocaleString("en-IN") : 0}
              </p>
              <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Lifetime average</p>
            </div>
            <div>
              <p className="admin-metric-label">Orders per customer</p>
              <p className="mt-2 font-sans text-2xl font-semibold tabular-nums text-[var(--admin-ink)]">
                {data.customersCount > 0 ? (data.ordersCount / data.customersCount).toFixed(1) : "0"}
              </p>
              <p className="mt-1 font-sans text-[11px] text-[var(--admin-muted)]">Average frequency</p>
            </div>
          </div>
        </AdminCard>
      </AdminSection>
    </AdminPageLayout>
  );
}
