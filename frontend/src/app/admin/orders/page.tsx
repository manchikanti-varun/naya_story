"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Copy,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Send,
  Truck,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import { ORDER_STATUSES } from "@/lib/constants";
import type { Order } from "@/types";
import {
  formatOrderStatus,
  orderCustomerLabel,
  orderItemCount,
  orderItemsPreview,
  orderStatusTone,
} from "@/lib/admin/order-utils";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminSplitView } from "@/components/admin/ui/AdminSplitView";
import { AdminStepper, type StepperStep } from "@/components/admin/ui/AdminStepper";
import { useToast } from "@/components/admin/ui/AdminToast";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 30;

const ORDER_STEPS: StepperStep[] = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

function matchesSearch(o: Order, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    o.orderNumber.toLowerCase().includes(needle) ||
    (o.guestEmail?.toLowerCase().includes(needle) ?? false) ||
    (o.trackingNumber?.toLowerCase().includes(needle) ?? false) ||
    o.shippingAddress?.city?.toLowerCase().includes(needle) ||
    o.shippingAddress?.postalCode?.toLowerCase().includes(needle) ||
    o.status.toLowerCase().includes(needle)
  );
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ orders: Order[] }>("/orders", { token });
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      return matchesSearch(o, q);
    });
  }, [orders, q, statusFilter]);

  const selectedOrder = useMemo(() => {
    if (!selectedId) return null;
    return orders.find((o) => o._id === selectedId) ?? null;
  }, [orders, selectedId]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => ["pending", "confirmed", "packed"].includes(o.status)).length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    return { pending, shipped, total: orders.length };
  }, [orders]);

  async function updateStatus(orderId: string, status: string) {
    if (!token) return;
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      publishStorefrontSettingsChanged();
      toast.success(`Order updated to ${formatOrderStatus(status)}`);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message ?? "Status update failed");
    }
  }

  async function updateTracking(orderId: string, trackingNumber: string) {
    if (!token) return;
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "shipped", trackingNumber }),
      });
      publishStorefrontSettingsChanged();
      toast.success("Tracking number saved");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save tracking");
    }
  }

  // === LIST PANEL ===
  const listPanel = (
    <div className="flex h-full flex-col">
      {/* List Header */}
      <div className="shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-sans text-lg font-bold text-[var(--admin-ink)]">Orders</h1>
            <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">
              {stats.pending > 0 && <span className="font-semibold text-amber-700">{stats.pending} need action</span>}
              {stats.pending > 0 && " · "}
              {stats.total} total
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)] disabled:opacity-50"
            aria-label="Refresh orders"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} strokeWidth={1.75} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]"
            strokeWidth={1.75}
          />
          <AdminInput
            className="!mt-0 pl-9"
            placeholder="Search order #, email, city…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Status Chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            className={cn(
              "rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] transition",
              !statusFilter
                ? "bg-[var(--admin-ink)] text-white"
                : "border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
            )}
          >
            All
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={cn(
                "rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                statusFilter === s
                  ? "bg-[var(--admin-ink)] text-white"
                  : "border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
              )}
            >
              {formatOrderStatus(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="font-sans text-sm text-[var(--admin-muted)]">Loading orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12">
            <AdminEmptyState
              title={orders.length === 0 ? "No orders yet" : "No matching orders"}
              description={orders.length === 0 ? "Orders appear here when customers check out." : "Try a different search or filter."}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--admin-border)]">
            {filtered.slice(0, PAGE_SIZE).map((o) => (
              <button
                key={o._id}
                type="button"
                onClick={() => setSelectedId(o._id)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3.5 text-left transition",
                  selectedId === o._id
                    ? "bg-[var(--admin-accent-soft)] border-l-2 border-l-[var(--admin-accent)]"
                    : "hover:bg-[var(--admin-surface-raised)]",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-semibold tabular-nums text-[var(--admin-ink)]">
                      {o.orderNumber}
                    </span>
                    <AdminBadge tone={orderStatusTone(o.status)}>
                      {formatOrderStatus(o.status)}
                    </AdminBadge>
                  </div>
                  <p className="mt-1 truncate font-sans text-xs text-[var(--admin-muted)]">
                    {orderCustomerLabel(o)}
                  </p>
                  <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">
                    {orderItemCount(o)} item{orderItemCount(o) !== 1 ? "s" : ""} · {orderItemsPreview(o)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-sans text-sm font-semibold tabular-nums text-[var(--admin-ink)]">
                    ₹{o.total.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-0.5 font-sans text-[10px] text-[var(--admin-faint)]">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--admin-faint)]" strokeWidth={1.5} />
              </button>
            ))}
            {filtered.length > PAGE_SIZE && (
              <p className="px-4 py-3 text-center font-sans text-xs text-[var(--admin-muted)]">
                Showing {PAGE_SIZE} of {filtered.length} orders
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // === DETAIL PANEL ===
  const detailPanel = selectedOrder ? (
    <OrderDetailPanel
      order={selectedOrder}
      onBack={() => setSelectedId(null)}
      onUpdateStatus={updateStatus}
      onUpdateTracking={updateTracking}
    />
  ) : (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Package className="mx-auto h-10 w-10 text-[var(--admin-faint)]" strokeWidth={1} />
        <p className="mt-3 font-sans text-sm text-[var(--admin-muted)]">Select an order to view details</p>
      </div>
    </div>
  );

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-8" style={{ height: "calc(100vh - 60px)" }}>
      <AdminSplitView
        list={listPanel}
        detail={detailPanel}
        hasSelection={!!selectedOrder}
        listWidth="w-[420px] min-w-[340px] max-w-[480px]"
      />
    </div>
  );
}

// ============================================
// ORDER DETAIL PANEL
// ============================================

function OrderDetailPanel({
  order,
  onBack,
  onUpdateStatus,
  onUpdateTracking,
}: {
  order: Order;
  onBack: () => void;
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
  onUpdateTracking: (orderId: string, tracking: string) => Promise<void>;
}) {
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber ?? "");
  const isCancelled = order.status === "cancelled";

  useEffect(() => {
    setTrackingInput(order.trackingNumber ?? "");
  }, [order.trackingNumber, order._id]);

  // Determine next allowed status for the quick-action button
  const nextStatus = useMemo(() => {
    const flow = ["pending", "confirmed", "packed", "shipped", "delivered"];
    const idx = flow.indexOf(order.status);
    if (idx < 0 || idx >= flow.length - 1) return null;
    return flow[idx + 1];
  }, [order.status]);

  return (
    <div className="flex h-full flex-col">
      {/* Detail Header */}
      <div className="shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)] lg:hidden"
            aria-label="Back to list"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="font-sans text-xl font-bold text-[var(--admin-ink)]">{order.orderNumber}</h2>
              <AdminBadge tone={isCancelled ? "danger" : orderStatusTone(order.status)}>
                {formatOrderStatus(order.status)}
              </AdminBadge>
            </div>
            <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          {nextStatus && !isCancelled ? (
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => void onUpdateStatus(order._id, nextStatus)}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
              Mark {formatOrderStatus(nextStatus)}
            </AdminButton>
          ) : null}
        </div>
      </div>

      {/* Detail Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* === STATUS STEPPER === */}
          <AdminCard padding="md">
            <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
              Order Progress
            </h3>
            <AdminStepper
              steps={ORDER_STEPS}
              currentStepId={order.status}
              cancelled={isCancelled}
              className="justify-center"
            />
            {!isCancelled && nextStatus ? (
              <div className="mt-5 flex items-center justify-center gap-2 border-t border-[var(--admin-border)] pt-4">
                <select
                  className="admin-input w-48 py-1.5 text-xs"
                  value={order.status}
                  onChange={(e) => void onUpdateStatus(order._id, e.target.value)}
                  aria-label="Change order status"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{formatOrderStatus(s)}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </AdminCard>

          {/* === CUSTOMER SUMMARY === */}
          <AdminCard padding="md">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
                Customer
              </h3>
            </div>
            <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">
              {orderCustomerLabel(order)}
            </p>
            {order.guestEmail ? (
              <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">{order.guestEmail}</p>
            ) : null}
          </AdminCard>

          {/* === SHIPPING ADDRESS === */}
          {order.shippingAddress ? (
            <AdminCard padding="md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
                    Shipping Address
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const addr = order.shippingAddress;
                    const text = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(", ");
                    void navigator.clipboard.writeText(text);
                  }}
                  className="rounded-md p-1.5 text-[var(--admin-faint)] transition hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]"
                  title="Copy address"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
              <div className="space-y-0.5 font-sans text-sm text-[var(--admin-muted)]">
                <p className="font-medium text-[var(--admin-ink)]">{order.shippingAddress.line1}</p>
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

          {/* === LINE ITEMS === */}
          <AdminCard padding="md">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
                Items ({order.items.length})
              </h3>
            </div>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] p-3"
                >
                  {item.image ? (
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" unoptimized />
                    </div>
                  ) : (
                    <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100">
                      <Package className="h-4 w-4 text-stone-400" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-medium text-[var(--admin-ink)]">{item.name}</p>
                    <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && " · "}
                      {item.color && `Color: ${item.color}`}
                      {(item.size || item.color) && " · "}
                      SKU: {item.sku}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-sans text-sm font-medium tabular-nums text-[var(--admin-ink)]">
                      ₹{((item.unitPrice ?? 0) * (item.quantity ?? 1)).toLocaleString("en-IN")}
                    </p>
                    <p className="mt-0.5 font-sans text-[10px] text-[var(--admin-faint)]">
                      {item.quantity} × ₹{(item.unitPrice ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="mt-4 space-y-2 border-t border-[var(--admin-border)] pt-4 font-sans text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--admin-muted)]">Subtotal</span>
                <span className="tabular-nums">₹{(order.subtotal ?? order.total).toLocaleString("en-IN")}</span>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-[var(--admin-muted)]">Discount</span>
                  <span className="tabular-nums text-emerald-700">−₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-[var(--admin-muted)]">Shipping</span>
                <span className="tabular-nums">{order.shipping === 0 ? "Free" : `₹${order.shipping.toLocaleString("en-IN")}`}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--admin-border)] pt-2">
                <span className="font-semibold text-[var(--admin-ink)]">Total</span>
                <span className="text-lg font-bold tabular-nums text-[var(--admin-ink)]">
                  ₹{order.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </AdminCard>

          {/* === TRACKING === */}
          <AdminCard padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
                Tracking
              </h3>
            </div>
            {order.trackingNumber ? (
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium text-[var(--admin-accent)]">{order.trackingNumber}</p>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(order.trackingNumber ?? "")}
                  className="rounded-md p-1 text-[var(--admin-faint)] hover:text-[var(--admin-ink)]"
                  title="Copy tracking number"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ) : null}
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (trackingInput.trim()) {
                  void onUpdateTracking(order._id, trackingInput.trim());
                }
              }}
            >
              <AdminInput
                className="!mt-0 min-w-0 flex-1"
                placeholder="Enter tracking number…"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
              />
              <AdminButton type="submit" variant="secondary" size="sm">
                {order.trackingNumber ? "Update" : "Add"}
              </AdminButton>
            </form>
          </AdminCard>

          {/* === TIMELINE === */}
          {order.timeline && order.timeline.length > 0 ? (
            <AdminCard padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
                <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
                  Timeline
                </h3>
              </div>
              <div className="space-y-0">
                {[...order.timeline].reverse().map((entry, idx) => (
                  <div key={idx} className="flex gap-3 pb-4 last:pb-0">
                    {/* Vertical connector */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        idx === 0 ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-border-strong)]",
                      )} />
                      {idx < order.timeline!.length - 1 && (
                        <div className="w-px flex-1 bg-[var(--admin-border)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 -mt-0.5">
                      <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">
                        {formatOrderStatus(entry.status)}
                      </p>
                      <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">
                        {new Date(entry.at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>
          ) : null}

          {/* === CANCEL ACTION === */}
          {!isCancelled && (order.status === "pending" || order.status === "confirmed") ? (
            <div className="border-t border-[var(--admin-border)] pt-4">
              <AdminButton
                variant="danger"
                size="sm"
                onClick={() => void onUpdateStatus(order._id, "cancelled")}
              >
                Cancel order
              </AdminButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
