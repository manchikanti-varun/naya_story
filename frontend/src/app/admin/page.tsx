"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, CircleDollarSign, Package, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type Overview = {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  recentOrders: {
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }[];
  salesTrend: { _id: string; revenue: number }[];
  lowStock: {
    name: string;
    slug: string;
    variants: { sku: string; stock: number }[];
  }[];
  outOfStockCount: number;
};

export default function AdminDashboardPage() {
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

  if (!data) {
    return <p className="font-sans text-sm text-slate-500">Loading overview…</p>;
  }

  const stockAttention =
    (data.outOfStockCount ?? 0) > 0 || (data.lowStock?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="border-b border-slate-200/80 pb-8">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Command center
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate-900 md:text-4xl">Business overview</h1>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
          Sales, orders, and customers. Stock levels are managed separately under{" "}
          <strong className="font-medium text-slate-800">Stock</strong> so this page stays focused on revenue.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Lifetime revenue"
          value={`₹${data.revenue.toLocaleString("en-IN")}`}
          icon={CircleDollarSign}
        />
        <MetricCard label="Orders placed" value={String(data.ordersCount)} icon={Package} />
        <MetricCard label="Registered customers" value={String(data.customersCount)} icon={Users} />
      </section>

      {stockAttention ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-900/80">
              Stock attention needed
            </p>
            <p className="mt-1 font-sans text-sm text-amber-950/90">
              <span className="font-semibold tabular-nums">{data.outOfStockCount ?? 0}</span> fully out-of-stock
              products ·{" "}
              <span className="font-semibold tabular-nums">{data.lowStock?.length ?? 0}</span> low-stock alerts
            </p>
          </div>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-slate-900 px-4 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-slate-800 sm:self-auto"
          >
            Open stock
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </Link>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-slate-900 md:text-2xl">Revenue trend</h2>
            <p className="mt-1 font-sans text-xs text-slate-500">Paid orders, last 30 days</p>
          </div>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.salesTrend}>
              <defs>
                <linearGradient id="nayaSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#475569"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#nayaSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl text-slate-900 md:text-2xl">Recent orders</h2>
        <p className="mt-1 font-sans text-xs text-slate-500">Latest eight, newest first</p>
        <ul className="mt-6 divide-y divide-slate-100 font-sans text-sm">
          {data.recentOrders.map((o) => (
            <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
              <span className="font-medium text-slate-800">{o.orderNumber}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                {o.status}
              </span>
              <span className="ml-auto font-medium tabular-nums text-slate-900">
                ₹{o.total.toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 hover:text-slate-900"
          >
            View all orders
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="mt-3 font-display text-2xl tabular-nums tracking-tight text-slate-900 md:text-3xl">{value}</p>
    </div>
  );
}
