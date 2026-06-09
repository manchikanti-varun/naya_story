"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Order } from "@/types";

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const data = await apiFetch<{ orders: Order[] }>("/orders/mine", { token });
        setOrders(data.orders);
      } catch {
        setOrders([]);
      }
    })();
  }, [token]);

  return (
    <div className="space-y-8 rounded-[32px] border border-ivory-deep bg-white/70 p-5 md:p-10 backdrop-blur">
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Orders</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Timelines</h1>
      </div>
      <ul className="space-y-6">
        {orders.map((order) => (
          <li
            key={order._id}
            className="flex flex-col gap-4 rounded-[24px] border border-ivory-deep bg-ivory-muted/30 p-6 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-display text-2xl text-ink">{order.orderNumber}</p>
              <p className="mt-2 font-sans text-xs uppercase tracking-[0.22em] text-ink-soft">
                {new Date(order.createdAt).toLocaleDateString()} · {order.status}
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <p className="font-sans text-sm text-ink">
                ₹{order.total.toLocaleString("en-IN")}
              </p>
              <Link
                href={`/account/orders/${order._id}`}
                className="rounded-full border border-gold px-6 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-gold hover:bg-gold hover:text-white"
              >
                View details
              </Link>
            </div>
          </li>
        ))}
        {orders.length === 0 ? (
          <li className="font-sans text-sm text-ink-muted">
            No orders yet — begin with the{" "}
            <Link href="/collections" className="text-gold underline-offset-4 hover:underline">
              collections edit
            </Link>
            .
          </li>
        ) : null}
      </ul>
    </div>
  );
}
