"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, PackageX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type Overview = {
  lowStock: {
    name: string;
    slug: string;
    variants: { sku: string; stock: number }[];
  }[];
  outOfStockCount: number;
};

export default function AdminInventoryPage() {
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

  if (!data) return <p className="font-sans text-sm text-slate-500">Loading stock data…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="border-b border-slate-200/80 pb-8">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Operations</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate-900 md:text-4xl">Stock</h1>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">
          This is your <strong className="font-medium text-slate-800">fulfillment view</strong>: what is out of stock
          and which variants are running low. The home overview only shows a summary link here so the two screens do
          not repeat the same lists.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <PackageX className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl text-slate-900">Out of stock</h2>
            <p className="mt-1 font-sans text-sm text-slate-600">
              Products where no variant has quantity left.
            </p>
            <p className="mt-4 font-display text-3xl tabular-nums text-slate-900">{data.outOfStockCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
            <AlertTriangle className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-slate-900">Low stock variants</h2>
            <p className="mt-1 font-sans text-sm text-slate-600">
              Variants with quantity between 1 and 5 units (studio threshold).
            </p>
            <ul className="mt-6 space-y-4 font-sans text-sm">
              {data.lowStock.map((p) => (
                <li key={p.slug} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="font-medium text-slate-900">{p.name}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {p.variants.map((v) => `${v.sku}: ${v.stock}`).join(" · ")}
                  </p>
                </li>
              ))}
              {data.lowStock.length === 0 ? (
                <li className="text-slate-500">No variants in the low-stock band.</li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 font-sans text-sm text-slate-600">
        Update quantities and SKUs in{" "}
        <Link href="/admin/products" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
          Product catalog
        </Link>
        .
      </div>

      <p className="font-sans text-xs text-slate-400">
        Optional: connect Shiprocket or your WMS later — this screen stays the single stock health check.
      </p>

      <Link
        href="/admin"
        className="inline-flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 hover:text-slate-900"
      >
        Back to overview
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
