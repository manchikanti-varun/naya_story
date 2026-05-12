"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { ORDER_STATUSES } from "@/lib/constants";
import type { Order } from "@/types";
import { cn } from "@/lib/cn";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const data = await apiFetch<{ order: Order }>(`/orders/${params.id}`, { token });
        setOrder(data.order);
      } catch {
        router.replace("/account/orders");
      }
    })();
  }, [params.id, router, token]);

  if (!order) {
    return (
      <div className="rounded-[32px] border border-ivory-deep bg-white/70 p-10 backdrop-blur">
        <p className="font-sans text-sm text-ink-muted">Pulling your timeline…</p>
      </div>
    );
  }

  const timeline = order.timeline?.length
    ? order.timeline
    : [{ status: order.status, at: order.createdAt }];

  return (
    <div className="space-y-10 rounded-[32px] border border-ivory-deep bg-white/70 p-10 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Order</p>
          <h1 className="mt-4 font-display text-4xl text-ink">{order.orderNumber}</h1>
          <p className="mt-3 font-sans text-sm text-ink-muted">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href="/account/orders"
          className="rounded-full border border-ivory-deep px-6 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted hover:border-gold hover:text-gold"
        >
          Back to orders
        </Link>
      </div>

      <section>
        <p className="font-display text-2xl text-ink">Fulfillment</p>
        <ol className="mt-6 space-y-4">
          {ORDER_STATUSES.map((status) => {
            const hit = timeline.find((t) => t.status === status);
            return (
              <li key={status} className="flex items-center gap-4">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    hit ? "bg-gold" : "bg-ivory-deep",
                  )}
                />
                <div>
                  <p className="font-sans text-sm uppercase tracking-[0.22em] text-ink">
                    {status}
                  </p>
                  {hit ? (
                    <p className="font-sans text-xs text-ink-soft">
                      {new Date(hit.at).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
        {order.trackingNumber ? (
          <p className="mt-6 font-sans text-sm text-ink-muted">
            Tracking:{" "}
            <span className="text-ink">{order.trackingNumber}</span> — carrier updates sync when
            Shiprocket is connected.
          </p>
        ) : null}
      </section>

      <section>
        <p className="font-display text-2xl text-ink">Items</p>
        <ul className="mt-6 space-y-4 font-sans text-sm text-ink-muted">
          {order.items.map((item, idx) => (
            <li key={`${item.sku}-${idx}`} className="flex justify-between gap-4">
              <span>
                {item.name}{" "}
                <span className="text-ink-soft">
                  · {item.color} / {item.size} ×{item.quantity}
                </span>
              </span>
              <span className="text-ink">
                ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-8 space-y-2 border-t border-ivory-deep pt-6 font-sans text-sm text-ink-muted">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="text-ink">₹{order.subtotal.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="text-ink">₹{order.shipping.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd className="text-ink">₹{order.discount.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between font-display text-xl text-ink">
            <dt>Total</dt>
            <dd>₹{order.total.toLocaleString("en-IN")}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
