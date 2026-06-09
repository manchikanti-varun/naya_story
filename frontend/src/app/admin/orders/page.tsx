"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Copy, MapPin, Package, Search, Send, Truck, User } from "lucide-react";
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
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { AdminStepper, type StepperStep } from "@/components/admin/ui/AdminStepper";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { useToast } from "@/components/admin/ui/AdminToast";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 20;
const ORDER_STEPS: StepperStep[] = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

function matchesSearch(o: Order, q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return o.orderNumber.toLowerCase().includes(n) || (o.guestEmail?.toLowerCase().includes(n) ?? false) || (o.trackingNumber?.toLowerCase().includes(n) ?? false) || o.shippingAddress?.city?.toLowerCase().includes(n) || o.status.toLowerCase().includes(n);
}

function TableSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
          <div className="h-4 w-16 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
          <div className="h-4 w-16 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-[var(--admin-surface-sunken)]" />
        </div>
      ))}
    </div>
  );
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { const data = await apiFetch<{ orders: Order[] }>("/orders", { token }); setOrders(data.orders); }
    catch { setOrders([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { setPage(1); }, [q, statusFilter]);

  const filtered = useMemo(() => orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    return matchesSearch(o, q);
  }), [orders, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function updateStatus(orderId: string, status: string) {
    if (!token) return;
    try {
      await apiFetch(`/orders/${orderId}/status`, { method: "PATCH", token, body: JSON.stringify({ status }) });
      publishStorefrontSettingsChanged();
      toast.success(`Updated to ${formatOrderStatus(status)}`);
      await refresh();
    } catch (e) { toast.error((e as Error).message ?? "Update failed"); }
  }

  const pendingCount = orders.filter((o) => ["pending", "confirmed", "packed"].includes(o.status)).length;

  return (
    <AdminPageLayout
      title="Orders"
      description={pendingCount > 0 ? `${pendingCount} need fulfillment` : undefined}
      toolbar={
        <div className="flex w-full items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
            <AdminInput className="!mt-0 pl-9" placeholder="Search orders…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="admin-input w-auto shrink-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatOrderStatus(s)}</option>)}
          </select>
        </div>
      }
    >
      {loading ? <TableSkeleton /> : filtered.length === 0 ? (
        <AdminEmptyState
          title={orders.length === 0 ? "No orders yet" : "No matching orders"}
          description={orders.length === 0 ? "Orders will appear here when customers complete checkout." : "Try adjusting your search or filter."}
        />
      ) : (
        <>
          <AdminTable>
            <table className="admin-table">
              <thead><tr>
                <th>Order</th><th>Date</th><th>Customer</th><th>Status</th><th className="text-right">Total</th>
              </tr></thead>
              <tbody>
                {pageRows.map((o) => (
                  <tr key={o._id} className="cursor-pointer" onClick={() => setSelectedOrder(o)}>
                    <td>
                      <p className="font-medium text-[var(--admin-ink)]">{o.orderNumber}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--admin-faint)]">{orderItemCount(o)} items</p>
                    </td>
                    <td className="whitespace-nowrap text-[var(--admin-muted)]">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="max-w-[10rem] truncate text-[var(--admin-muted)]">{orderCustomerLabel(o)}</td>
                    <td><AdminBadge tone={orderStatusTone(o.status)}>{formatOrderStatus(o.status)}</AdminBadge></td>
                    <td className="text-right font-medium tabular-nums">₹{o.total.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
          {filtered.length > PAGE_SIZE && <AdminPagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}
        </>
      )}

      {/* Order Detail Drawer */}
      <AdminDrawer open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={selectedOrder?.orderNumber ?? ""} description={selectedOrder ? `Placed ${new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : undefined}>
        {selectedOrder && <OrderDetail order={selectedOrder} onUpdateStatus={updateStatus} />}
      </AdminDrawer>
    </AdminPageLayout>
  );
}

function OrderDetail({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, s: string) => Promise<void> }) {
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber ?? "");
  const { token } = useAuth();
  const toast = useToast();
  const isCancelled = order.status === "cancelled";

  const nextStatus = useMemo(() => {
    const flow = ["pending", "confirmed", "packed", "shipped", "delivered"];
    const idx = flow.indexOf(order.status);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  }, [order.status]);

  return (
    <div className="space-y-6">
      {/* Status stepper */}
      <AdminStepper steps={ORDER_STEPS} currentStepId={order.status} cancelled={isCancelled} />
      {nextStatus && !isCancelled && (
        <div className="flex items-center gap-2">
          <AdminButton variant="primary" size="sm" onClick={() => void onUpdateStatus(order._id, nextStatus)}>
            <Send className="h-3.5 w-3.5" strokeWidth={1.75} /> Mark {formatOrderStatus(nextStatus)}
          </AdminButton>
          {(order.status === "pending" || order.status === "confirmed") && (
            <AdminButton variant="danger" size="sm" onClick={() => void onUpdateStatus(order._id, "cancelled")}>Cancel order</AdminButton>
          )}
        </div>
      )}

      {/* Customer & Address */}
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminCard padding="sm">
          <p className="mb-1.5 text-[11px] font-medium text-[var(--admin-muted)]">Customer</p>
          <p className="text-sm font-medium text-[var(--admin-ink)]">{orderCustomerLabel(order)}</p>
          {order.guestEmail && <p className="mt-0.5 text-xs text-[var(--admin-faint)]">{order.guestEmail}</p>}
        </AdminCard>
        {order.shippingAddress && (
          <AdminCard padding="sm">
            <p className="mb-1.5 text-[11px] font-medium text-[var(--admin-muted)]">Shipping</p>
            <p className="text-sm text-[var(--admin-ink)]">{order.shippingAddress.line1}</p>
            <p className="text-xs text-[var(--admin-faint)]">{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}</p>
          </AdminCard>
        )}
      </div>

      {/* Items */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-[var(--admin-muted)]">Items</p>
        <div className="space-y-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--admin-ink)]">{item.name}</p>
                <p className="text-[11px] text-[var(--admin-faint)]">{[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums">₹{((item.unitPrice ?? 0) * (item.quantity ?? 1)).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1.5 border-t border-[var(--admin-border)] pt-4 text-sm">
        <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Subtotal</span><span className="tabular-nums">₹{order.subtotal.toLocaleString("en-IN")}</span></div>
        {order.discount > 0 && <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Discount</span><span className="tabular-nums text-emerald-700">−₹{order.discount.toLocaleString("en-IN")}</span></div>}
        <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Shipping</span><span className="tabular-nums">{order.shipping === 0 ? "Free" : `₹${order.shipping.toLocaleString("en-IN")}`}</span></div>
        <div className="flex justify-between border-t border-[var(--admin-border)] pt-2 font-semibold"><span>Total</span><span className="tabular-nums">₹{order.total.toLocaleString("en-IN")}</span></div>
      </div>

      {/* Tracking */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-[var(--admin-muted)]">Tracking</p>
        {order.trackingNumber && (
          <button type="button" onClick={() => { void navigator.clipboard.writeText(order.trackingNumber!); toast.success("Copied"); }}
            className="mb-2 inline-flex items-center gap-1.5 font-mono text-sm text-[var(--admin-accent)] hover:underline" title="Click to copy">
            {order.trackingNumber} <Copy className="h-3 w-3" strokeWidth={1.75} />
          </button>
        )}
        <form className="flex gap-2" onSubmit={async (e) => {
          e.preventDefault();
          if (!token || !trackingInput.trim()) return;
          await apiFetch(`/orders/${order._id}/status`, { method: "PATCH", token, body: JSON.stringify({ status: "shipped", trackingNumber: trackingInput.trim() }) });
          publishStorefrontSettingsChanged();
          toast.success("Tracking saved");
        }}>
          <AdminInput className="!mt-0 flex-1" placeholder="Add tracking number…" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} />
          <AdminButton type="submit" variant="secondary" size="sm">Save</AdminButton>
        </form>
      </div>

      {/* Timeline */}
      {order.timeline && order.timeline.length > 1 ? (
        <div>
          <p className="mb-2 text-[11px] font-medium text-[var(--admin-muted)]">Timeline</p>
          <div className="space-y-2">
            {[...order.timeline].reverse().map((e, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", i === 0 ? "bg-[var(--admin-ink)]" : "bg-[var(--admin-border-strong)]")} />
                <div>
                  <p className="text-sm text-[var(--admin-ink)]">{formatOrderStatus(e.status)}</p>
                  <p className="text-[10px] text-[var(--admin-faint)]">{new Date(e.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
