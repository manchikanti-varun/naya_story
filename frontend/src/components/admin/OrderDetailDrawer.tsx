"use client";

import { useEffect } from "react";
import { MapPin, Package, User, X } from "lucide-react";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminStatusTimeline, type TimelineStep } from "@/components/admin/ui/AdminStatusTimeline";
import { formatOrderStatus, orderCustomerLabel, orderStatusTone } from "@/lib/admin/order-utils";
import type { Order } from "@/types";

type Props = {
  order: Order | null;
  onClose: () => void;
};

const ORDER_FLOW: { id: string; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

function buildTimeline(order: Order): TimelineStep[] {
  return ORDER_FLOW.map((step) => ({
    id: step.id,
    label: step.label,
  }));
}

export function OrderDetailDrawer({ order, onClose }: Props) {
  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [order, onClose]);

  if (!order) return null;

  const isCancelled = order.status === "cancelled";
  const timelineSteps = buildTimeline(order);
  const currentStep = isCancelled ? "cancelled" : order.status;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--admin-ink)]/30 backdrop-blur-[3px]"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="admin-drawer-panel absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-[var(--admin-border-strong)] bg-[var(--admin-surface)] shadow-2xl"
      >
        {/* Header */}
        <header className="admin-drawer-header flex shrink-0 items-start justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <p className="admin-metric-label text-[var(--admin-accent)]">Order details</p>
            <h2 className="mt-1 font-sans text-xl font-semibold text-[var(--admin-ink)]">
              {order.orderNumber}
            </h2>
            <p className="mt-1 font-sans text-sm text-[var(--admin-muted)]">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        {/* Body */}
        <div className="admin-drawer-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Status & Timeline */}
          <AdminCard padding="md">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Order status</h3>
              <AdminBadge tone={isCancelled ? "danger" : orderStatusTone(order.status)}>
                {isCancelled ? "Cancelled" : formatOrderStatus(order.status)}
              </AdminBadge>
            </div>
            {!isCancelled ? (
              <AdminStatusTimeline steps={timelineSteps} currentStepId={currentStep} />
            ) : (
              <p className="font-sans text-sm text-[var(--admin-muted)]">
                This order was cancelled.
              </p>
            )}
          </AdminCard>

          {/* Customer */}
          <AdminCard padding="md">
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <h3 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Customer</h3>
            </div>
            <p className="font-sans text-sm text-[var(--admin-ink)]">{orderCustomerLabel(order)}</p>
            {order.guestEmail ? (
              <p className="mt-1 font-sans text-xs text-[var(--admin-muted)]">{order.guestEmail}</p>
            ) : null}
          </AdminCard>

          {/* Shipping Address */}
          {order.shippingAddress ? (
            <AdminCard padding="md">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
                <h3 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Shipping address</h3>
              </div>
              <div className="space-y-0.5 font-sans text-sm text-[var(--admin-muted)]">
                {order.shippingAddress.line1 ? <p className="font-medium text-[var(--admin-ink)]">{order.shippingAddress.line1}</p> : null}
                {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                <p>
                  {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.shippingAddress.country ? <p>{order.shippingAddress.country}</p> : null}
              </div>
            </AdminCard>
          ) : null}

          {/* Order Items */}
          <AdminCard padding="md">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <h3 className="font-sans text-sm font-semibold text-[var(--admin-ink)]">
                Items ({order.items?.length ?? 0})
              </h3>
            </div>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-[var(--admin-ink)]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">
                      {item.size ? `Size: ${item.size}` : ""}
                      {item.size && item.quantity ? " · " : ""}
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-sans text-sm font-medium tabular-nums text-[var(--admin-ink)]">
                    ₹{((item.unitPrice ?? 0) * (item.quantity ?? 1)).toLocaleString("en-IN")}
                  </p>
                </div>
              )) ?? null}
            </div>
          </AdminCard>

          {/* Order Summary */}
          <AdminCard padding="md">
            <h3 className="mb-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">Summary</h3>
            <div className="space-y-2 font-sans text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--admin-muted)]">Subtotal</span>
                <span className="tabular-nums">₹{(order.subtotal ?? order.total).toLocaleString("en-IN")}</span>
              </div>
              {order.discount ? (
                <div className="flex justify-between">
                  <span className="text-[var(--admin-muted)]">Discount</span>
                  <span className="tabular-nums text-emerald-700">−₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              ) : null}
              {order.shipping ? (
                <div className="flex justify-between">
                  <span className="text-[var(--admin-muted)]">Shipping</span>
                  <span className="tabular-nums">₹{order.shipping.toLocaleString("en-IN")}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-[var(--admin-border)] pt-2">
                <span className="font-semibold text-[var(--admin-ink)]">Total</span>
                <span className="font-semibold tabular-nums text-[var(--admin-ink)]">
                  ₹{order.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </AdminCard>

          {/* Tracking */}
          {order.trackingNumber ? (
            <AdminCard padding="md">
              <h3 className="mb-2 font-sans text-sm font-semibold text-[var(--admin-ink)]">Tracking</h3>
              <p className="font-mono text-sm text-[var(--admin-accent)]">{order.trackingNumber}</p>
            </AdminCard>
          ) : null}
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-4">
          <AdminButton variant="secondary" onClick={onClose}>
            Close
          </AdminButton>
        </footer>
      </aside>
    </div>
  );
}
