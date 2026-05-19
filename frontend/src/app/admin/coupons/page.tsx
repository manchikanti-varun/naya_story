"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";

type Coupon = {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
};

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [draft, setDraft] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: 10,
    usageLimit: 500,
  });

  async function refresh() {
    if (!token) return;
    const data = await apiFetch<{ coupons: Coupon[] }>("/coupons", { token });
    setCoupons(data.coupons);
  }

  useEffect(() => {
    void refresh().catch(() => setCoupons([]));
  }, [token]);

  return (
    <div className="space-y-10">
      <header>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-slate-400">Pricing</p>
        <h1 className="mt-3 font-display text-4xl text-slate-900">Coupons</h1>
      </header>

      <form
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!token) return;
          await apiFetch("/coupons", {
            method: "POST",
            token,
            body: JSON.stringify(draft),
          });
          publishStorefrontSettingsChanged();
          setDraft({ code: "", type: "percent", value: 10, usageLimit: 500 });
          await refresh();
        }}
      >
        <input
          placeholder="CODE"
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase"
          required
        />
        <select
          value={draft.type}
          onChange={(e) =>
            setDraft({ ...draft, type: e.target.value as "percent" | "fixed" })
          }
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="percent">Percent</option>
          <option value="fixed">Fixed ₹</option>
        </select>
        <input
          type="number"
          value={draft.value}
          onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-4 py-2 font-sans text-xs uppercase tracking-[0.22em] text-white"
        >
          Create
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Value</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4 text-right">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.map((c) => (
              <tr key={c._id}>
                <td className="px-6 py-4 font-medium text-slate-900">{c.code}</td>
                <td className="px-6 py-4 text-slate-600">{c.type}</td>
                <td className="px-6 py-4 text-slate-600">{c.value}</td>
                <td className="px-6 py-4 text-slate-600">
                  {c.usedCount}/{c.usageLimit ?? "∞"}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.18em] text-slate-500"
                    onClick={async () => {
                      if (!token) return;
                      await apiFetch(`/coupons/${c._id}`, {
                        method: "PATCH",
                        token,
                        body: JSON.stringify({ active: !c.active }),
                      });
                      publishStorefrontSettingsChanged();
                      await refresh();
                    }}
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
