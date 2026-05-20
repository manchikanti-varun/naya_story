"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, PackageX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminMetricCard } from "@/components/admin/ui/AdminMetricCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

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

  if (!data) {
    return (
      <AdminPageLayout eyebrow="Operations" title="Stock" maxWidthClass="max-w-3xl">
        <p className="font-sans text-sm text-[var(--admin-muted)]">Loading stock data…</p>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      eyebrow="Operations"
      title="Stock"
      maxWidthClass="max-w-3xl"
      description={
        <>
          Fulfillment view: out-of-stock products and variants running low. Update quantities in{" "}
          <Link href="/admin/products" className="admin-link font-medium">
            Product catalog
          </Link>
          .
        </>
      }
    >
      <AdminMetricCard
        label="Out of stock"
        value={String(data.outOfStockCount)}
        icon={PackageX}
        hint="Products where no variant has quantity left."
        accent={data.outOfStockCount > 0}
      />

      <AdminCard elevated padding="md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
            <AlertTriangle className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-sans text-base font-semibold text-[var(--admin-ink)]">Low stock variants</h2>
            <p className="mt-1 font-sans text-sm text-[var(--admin-muted)]">
              Variants with quantity between 1 and 5 units.
            </p>
            <ul className="mt-6 space-y-3 font-sans text-sm">
              {data.lowStock.map((p) => (
                <li
                  key={p.slug}
                  className="rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-3"
                >
                  <p className="font-medium text-[var(--admin-ink)]">{p.name}</p>
                  <p className="mt-1 font-mono text-xs text-[var(--admin-faint)]">
                    {p.variants.map((v) => `${v.sku}: ${v.stock}`).join(" · ")}
                  </p>
                </li>
              ))}
              {data.lowStock.length === 0 ? (
                <li className="text-[var(--admin-muted)]">No variants in the low-stock band.</li>
              ) : null}
            </ul>
          </div>
        </div>
      </AdminCard>

      <Link href="/admin">
        <AdminButton variant="ghost" size="sm">
          Back to overview
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </AdminButton>
      </Link>
    </AdminPageLayout>
  );
}
