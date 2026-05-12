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

type Overview = {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  salesTrend: { _id: string; revenue: number }[];
};

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Overview | null>(null);

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

  if (!data) return <p className="text-sm text-slate-500">Pulling analytics…</p>;

  const conversion = Math.min(
    100,
    data.ordersCount === 0 ? 0 : Number(((data.ordersCount / data.customersCount) * 8).toFixed(1)),
  );

  return (
    <div className="space-y-10">
      <header>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-slate-400">Insights</p>
        <h1 className="mt-3 font-display text-4xl text-slate-900">Analytics</h1>
        <p className="mt-4 max-w-2xl font-sans text-sm text-slate-500">
          Lightweight dashboards mirror your revenue rhythm and studio momentum — plug in product analytics when you scale traffic.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Avg. order value</p>
          <p className="mt-4 font-display text-3xl text-slate-900">
            ₹
            {data.ordersCount === 0
              ? "0"
              : Math.round(data.revenue / data.ordersCount).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Conversion proxy</p>
          <p className="mt-4 font-display text-3xl text-slate-900">{conversion}%</p>
          <p className="mt-2 text-xs text-slate-400">
            Derived from orders vs customers — replace with funnel events later.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Net revenue</p>
          <p className="mt-4 font-display text-3xl text-slate-900">
            ₹{data.revenue.toLocaleString("en-IN")}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-display text-2xl text-slate-900">Daily pace</p>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="revenue" fill="#0f172a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
