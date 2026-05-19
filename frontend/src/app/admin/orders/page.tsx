"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import { ORDER_STATUSES } from "@/lib/constants";
import type { Order } from "@/types";

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  async function refresh() {
    if (!token) return;
    const data = await apiFetch<{ orders: Order[] }>("/orders", { token });
    setOrders(data.orders);
  }

  useEffect(() => {
    void refresh().catch(() => setOrders([]));
  }, [token]);

  return (
    <div className="space-y-10">
      <header>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-slate-400">Operations</p>
        <h1 className="mt-3 font-display text-4xl text-slate-900">Orders</h1>
      </header>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Tracking</th>
              <th className="px-6 py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="px-6 py-4 font-medium text-slate-900">{o.orderNumber}</td>
                <td className="px-6 py-4">
                  <select
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs uppercase tracking-[0.16em]"
                    value={o.status}
                    onChange={async (e) => {
                      if (!token) return;
                      await apiFetch(`/orders/${o._id}/status`, {
                        method: "PATCH",
                        token,
                        body: JSON.stringify({ status: e.target.value }),
                      });
                      publishStorefrontSettingsChanged();
                      await refresh();
                    }}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <InlineTracking order={o} token={token!} onSaved={refresh} />
                </td>
                <td className="px-6 py-4 text-right text-slate-900">
                  ₹{o.total.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InlineTracking({
  order,
  token,
  onSaved,
}: {
  order: Order;
  token: string;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(order.trackingNumber ?? "");

  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await apiFetch(`/orders/${order._id}/status`, {
          method: "PATCH",
          token,
          body: JSON.stringify({ status: order.status, trackingNumber: value }),
        });
        publishStorefrontSettingsChanged();
        await onSaved();
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="AWB / tracking"
        className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-xs"
      />
      <button type="submit" className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white">
        Save
      </button>
    </form>
  );
}
