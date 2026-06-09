"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { AdminStepper, type StepperStep } from "@/components/admin/ui/AdminStepper";
import { AdminTable } from "@/components/admin/ui/AdminTable";
import { AdminToolbar } from "@/components/admin/ui/AdminToolbar";
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
      toast.success(`Order updated to ${formatOrderStatus(status)}`);
      await refresh();
      if (selectedOrder?._id === orderId) {
        const updated = orders.find((o) => o._id === orderId);
        if (updated) setSelectedOrder({ ...updated, status });
      }
    } catch (e) { toast.error((e as Error).message ?? "Update failed"); }
  }

  return (
    <AdminPageLayout
      title="Orders"
      description={`${orders.length} total · ${orders.filter((o) => ["pending", "confirmed", "packed"].includes(o.status)).length} need action`}
      actions={
        <button type="button" onClick={() => void refresh()} disabled={loading}
          className="admin-btn admin-btn--secondary admin-btn--sm">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} strokeWidth={1.75} /> Refresh
        </button>
      }
      toolbar={
        <AdminToolbar className="w-full border-0 bg-transparent p-0 shadow-none">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
            <AdminInput className="!mt-0 pl-9" placeholder="Search order #, email, city…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="admin-input w-full shrink-0 sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatOrderStatus(s)}</option>)}
          </select>
        </AdminToolbar>
      }
    >
      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5">
        {["", ...ORDER_STATUSES].map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)}
            className={cn("rounded-full px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] transition",
              statusFilter === s ? "bg-[var(--admin-ink)] text-white" : "border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-ink)]")}>
            {s ? formatOrderStatus(s) : "All"}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {!loading && filtered.length === 0 ? (
        <AdminEmptyState title="No orders found" description={orders.length === 0 ? "Orders appear when customers check out." : "Try a different search."} />
      ) : (
        <AdminTable>
          <table className="admin-table">
            <thead><tr>
              <th>Order</th><th>Date</th><th>Customer</th><th>Status</th><th className="text-right">Total</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="py-10 text-center text-[var(--admin-muted)]">Loading…</td></tr> : null}
              {!loading && pageRows.map((o) => (
                <tr key={o._id} className="cursor-pointer" onClick={() => setSelectedOrder(o)}>
                  <td>
                    <p className="font-medium text-[var(--admin-ink)]">{o.orderNumber}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--admin-faint)]">{orderItemsPreview(o)}</p>
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
      )}

      {filtered.length > PAGE_SIZE && <AdminPagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />}

      {/* Order Detail Drawer */}
      <AdminDrawer open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={selectedOrder?.orderNumber ?? ""}>
        {selectedOrder && <OrderDetail order={selectedOrder} onUpdateStatus={updateStatus} onClose={() => setSelectedOrder(null)} />}
      </AdminDrawer>
    </AdminPageLayout>
  );
}

function OrderDetail({ order, onUpdateStatus, onClose }: { order: Order; onUpdateStatus: (id: string, s: string) => Promise<void>; onClose: () => void }) {
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
      {/* Status */}
      <div>
        <AdminStepper steps={ORDER_STEPS} currentStepId={order.status} cancelled={isCancelled} />
        {nextStatus && !isCancelled && (
          <div className="mt-4 flex items-center gap-2">
            <AdminButton variant="primary" size="sm" onClick={() => void onUpdateStatus(order._id, nextStatus)}>
              <Send className="h-3.5 w-3.5" strokeWidth={1.75} /> Mark {formatOrderStatus(nextStatus)}
            </AdminButton>
            {(order.status === "pending" || order.status === "confirmed") && (
              <AdminButton variant="danger" size="sm" onClick={() => void onUpdateStatus(order._id, "cancelled")}>Cancel</AdminButton>
            )}
          </div>
        )}
      </div>

      {/* Customer */}
      <AdminCard padding="sm">
        <div className="flex items-center gap-2 mb-2"><User className="h-3.5 w-3.5 text-[var(--admin-faint)]" strokeWidth={1.5} /><span className="text-xs font-medium text-[var(--admin-muted)]">Customer</span></div>
        <p className="text-sm font-medium text-[var(--admin-ink)]">{orderCustomerLabel(order)}</p>
        {order.guestEmail && <p className="text-xs text-[var(--admin-muted)]">{order.guestEmail}</p>}
      </AdminCard>

      {/* Address */}
      {order.shippingAddress && (
        <AdminCard padding="sm">
          <div className="flex items-center gap-2 mb-2"><MapPin className="h-3.5 w-3.5 text-[var(--admin-faint)]" strokeWidth={1.5} /><span className="text-xs font-medium text-[var(--admin-muted)]">Shipping</span></div>
          <p className="text-sm text-[var(--admin-ink)]">{order.shippingAddress.line1}</p>
          <p className="text-xs text-[var(--admin-muted)]">{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}</p>
        </AdminCard>
      )}

      {/* Items */}
      <div>
        <p className="mb-2 text-xs font-medium text-[var(--admin-muted)]">Items ({order.items.length})</p>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--admin-ink)]">{item.name}</p>
                <p className="text-[11px] text-[var(--admin-faint)]">{item.size} · Qty: {item.quantity}</p>
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
        <div className="flex justify-between border-t border-[var(--admin-border)] pt-1.5 font-semibold"><span>Total</span><span className="tabular-nums">₹{order.total.toLocaleString("en-IN")}</span></div>
      </div>

      {/* Tracking */}
      <div>
        <p className="mb-2 text-xs font-medium text-[var(--admin-muted)]">Tracking</p>
        {order.trackingNumber && <p className="mb-2 font-mono text-sm text-[var(--admin-accent)]">{order.trackingNumber}</p>}
        <form className="flex gap-2" onSubmit={async (e) => {
          e.preventDefault();
          if (!token || !trackingInput.trim()) return;
          await apiFetch(`/orders/${order._id}/status`, { method: "PATCH", token, body: JSON.stringify({ status: "shipped", trackingNumber: trackingInput.trim() }) });
          publishStorefrontSettingsChanged();
          toast.success("Tracking saved");
        }}>
          <AdminInput className="!mt-0 flex-1" placeholder="Tracking #" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} />
          <AdminButton type="submit" variant="secondary" size="sm">Save</AdminButton>
        </form>
      </div>

      {/* Timeline */}
      {order.timeline?.length ? (
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--admin-muted)]">Timeline</p>
          <div className="space-y-2">
            {[...order.timeline].reverse().map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", i === 0 ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-border-strong)]")} />
                <div><p className="text-sm text-[var(--admin-ink)]">{formatOrderStatus(e.status)}</p><p className="text-[10px] text-[var(--admin-faint)]">{new Date(e.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
