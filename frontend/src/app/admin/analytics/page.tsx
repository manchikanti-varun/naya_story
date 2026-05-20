"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminMetricCard } from "@/components/admin/ui/AdminMetricCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

type Overview = {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  salesTrend: { _id: string; revenue: number }[];
};

const CHART_HEIGHT = 288;

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

  if (!data) {
    return (
      <AdminPageLayout eyebrow="Insights" title="Analytics" description="Loading metrics…">
        <p className="font-sans text-sm text-[var(--admin-muted)]">Pulling analytics…</p>
      </AdminPageLayout>
    );
  }

  const conversion = Math.min(
    100,
    data.ordersCount === 0 ? 0 : Number(((data.ordersCount / Math.max(data.customersCount, 1)) * 8).toFixed(1)),
  );

  const aov =
    data.ordersCount === 0 ? 0 : Math.round(data.revenue / data.ordersCount);

  return (
    <AdminPageLayout
      eyebrow="Insights"
      title="Analytics"
      description="Revenue rhythm and order pace from paid orders. Replace the conversion proxy with funnel events when you scale traffic."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard label="Avg. order value" value={`₹${aov.toLocaleString("en-IN")}`} />
        <AdminMetricCard
          label="Conversion proxy"
          value={`${conversion}%`}
          hint="Orders vs customers — illustrative until funnel tracking ships."
        />
        <AdminMetricCard label="Net revenue" value={`₹${data.revenue.toLocaleString("en-IN")}`} />
      </section>

      <AdminCard elevated padding="md">
        <h2 className="font-sans text-lg font-semibold text-[var(--admin-ink)]">Daily pace</h2>
        <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">Last 30 days</p>
        <div className="mt-6 w-full min-w-0" style={{ height: CHART_HEIGHT }}>
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
    </AdminPageLayout>
  );
}
