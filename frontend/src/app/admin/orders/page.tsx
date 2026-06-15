"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Copy, Download, MapPin, Package, Search, Send, Truck, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { publishStorefrontSettingsChanged } from "@/lib/storefront-live-sync";
import { ORDER_STATUSES } from "@/lib/constants";
import type { Order } from "@/types";
import {
  formatOrderStatus,
  orderCustomerLabel,
  orderItemCount,
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

const PAYMENT_STATUS_TONE: Record<string, "success" | "warning" | "danger"> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
};

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

function getCustomerName(o: Order): string {
  if (o.customerName) return o.customerName;
  if (typeof o.user === "object" && o.user?.name) return o.user.name;
  return orderCustomerLabel(o);
}

function getCustomerEmail(o: Order): string {
  if (o.guestEmail) return o.guestEmail;
  if (typeof o.user === "object" && o.user?.email) return o.user.email;
  return "";
}

function getCustomerPhone(o: Order): string {
  if (o.customerPhone) return o.customerPhone;
  if (typeof o.user === "object" && o.user?.phone) return o.user.phone;
  return "";
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      if (q.trim()) params.set("q", q.trim());

      const data = await apiFetch<{ orders: Order[]; total: number; pages: number }>(`/orders?${params.toString()}`, { token });
      setOrders(data.orders);
      setTotalPages(data.pages);
      setTotalItems(data.total);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter, paymentFilter, q]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { setPage(1); }, [q, statusFilter, paymentFilter]);

  async function updateStatus(orderId: string, status: string, trackingNumber?: string, shippingCarrier?: string) {
    if (!token) return;
    try {
      const body: Record<string, string> = { status };
      if (trackingNumber) body.trackingNumber = trackingNumber;
      if (shippingCarrier) body.shippingCarrier = shippingCarrier;
      await apiFetch(`/orders/${orderId}/status`, { method: "PATCH", token, body: JSON.stringify(body) });
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
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
            <AdminInput className="!mt-0 pl-9" placeholder="Search orders, customer, tracking…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="admin-input w-auto shrink-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{formatOrderStatus(s)}</option>)}
          </select>
          <select className="admin-input w-auto shrink-0" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} aria-label="Filter payment">
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      }
    >
      {loading ? <TableSkeleton /> : orders.length === 0 ? (
        <AdminEmptyState
          title={!q && !statusFilter && !paymentFilter ? "No orders yet" : "No matching orders"}
          description={!q && !statusFilter && !paymentFilter ? "Orders will appear here when customers complete checkout." : "Try adjusting your search or filter."}
        />
      ) : (
        <>
          <AdminTable>
            <table className="admin-table">
              <thead><tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="cursor-pointer" onClick={() => setSelectedOrder(o)}>
                    <td>
                      <p className="font-medium text-[var(--admin-ink)]">{o.orderNumber}</p>
                    </td>
                    <td className="whitespace-nowrap text-[var(--admin-muted)]">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="max-w-[10rem]">
                      <p className="truncate text-[var(--admin-ink)]">{getCustomerName(o)}</p>
                      <p className="truncate text-[10px] text-[var(--admin-faint)]">{getCustomerEmail(o)}</p>
                    </td>
                    <td className="text-[var(--admin-muted)]">{orderItemCount(o)} items</td>
                    <td>
                      <AdminBadge tone={PAYMENT_STATUS_TONE[o.paymentStatus ?? "pending"] ?? "warning"}>
                        {(o.paymentStatus ?? "pending").charAt(0).toUpperCase() + (o.paymentStatus ?? "pending").slice(1)}
                      </AdminBadge>
                    </td>
                    <td><AdminBadge tone={orderStatusTone(o.status)}>{formatOrderStatus(o.status)}</AdminBadge></td>
                    <td className="text-right font-medium tabular-nums">₹{o.total.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
          {totalItems > PAGE_SIZE && <AdminPagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={PAGE_SIZE} onPageChange={setPage} />}
        </>
      )}

      {/* Order Detail Drawer */}
      <AdminDrawer open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={selectedOrder?.orderNumber ?? ""} description={selectedOrder ? `Placed ${new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : undefined}>
        {selectedOrder && <OrderDetail order={selectedOrder} onUpdateStatus={updateStatus} onRefresh={refresh} />}
      </AdminDrawer>
    </AdminPageLayout>
  );
}

function OrderDetail({ order, onUpdateStatus, onRefresh }: { order: Order; onUpdateStatus: (id: string, s: string, t?: string, c?: string) => Promise<void>; onRefresh: () => Promise<void> }) {
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber ?? "");
  const [carrierInput, setCarrierInput] = useState(order.shippingCarrier ?? "");
  const { token } = useAuth();
  const toast = useToast();
  const isCancelled = order.status === "cancelled";

  const nextStatus = useMemo(() => {
    const flow = ["pending", "confirmed", "packed", "shipped", "delivered"];
    const idx = flow.indexOf(order.status);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  }, [order.status]);

  async function downloadInvoice() {
    if (!token) return;
    try {
      const data = await apiFetch<{ invoice: unknown }>(`/invoices/orders/${order._id}/invoice`, { token });
      // Create a downloadable JSON invoice (can be rendered as PDF on client)
      const blob = new Blob([JSON.stringify(data.invoice, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.orderNumber}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to download invoice");
    }
  }

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

      {/* Customer info */}
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminCard padding="sm">
          <p className="mb-1.5 text-[11px] font-medium text-[var(--admin-muted)]">Customer</p>
          <p className="text-sm font-medium text-[var(--admin-ink)]">{getCustomerName(order)}</p>
          <p className="mt-0.5 text-xs text-[var(--admin-faint)]">{getCustomerEmail(order)}</p>
          {getCustomerPhone(order) && <p className="mt-0.5 text-xs text-[var(--admin-faint)]">📱 {getCustomerPhone(order)}</p>}
        </AdminCard>
        {order.shippingAddress && (
          <AdminCard padding="sm">
            <p className="mb-1.5 text-[11px] font-medium text-[var(--admin-muted)]">Shipping Address</p>
            <p className="text-sm text-[var(--admin-ink)]">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p className="text-xs text-[var(--admin-ink)]">{order.shippingAddress.line2}</p>}
            <p className="text-xs text-[var(--admin-faint)]">{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}</p>
            <p className="text-xs text-[var(--admin-faint)]">{order.shippingAddress.country}</p>
          </AdminCard>
        )}
      </div>

      {/* Payment info */}
      <AdminCard padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[var(--admin-muted)]">Payment</p>
            <p className="mt-1 text-sm text-[var(--admin-ink)]">{(order.paymentProvider ?? "stripe").toUpperCase()}</p>
          </div>
          <AdminBadge tone={PAYMENT_STATUS_TONE[order.paymentStatus ?? "pending"] ?? "warning"}>
            {(order.paymentStatus ?? "pending").charAt(0).toUpperCase() + (order.paymentStatus ?? "pending").slice(1)}
          </AdminBadge>
        </div>
      </AdminCard>

      {/* Items */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-[var(--admin-muted)]">Items</p>
        <div className="space-y-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-xs)] border border-[var(--admin-border)] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--admin-ink)]">{item.name}</p>
                <p className="text-[11px] text-[var(--admin-faint)]">
                  {[item.size, item.color].filter(Boolean).join(" · ")} — SKU: {item.sku} — Qty: {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums">₹{((item.unitPrice ?? 0) * (item.quantity ?? 1)).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1.5 border-t border-[var(--admin-border)] pt-4 text-sm">
        <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Subtotal</span><span className="tabular-nums">₹{order.subtotal.toLocaleString("en-IN")}</span></div>
        {order.discount > 0 && <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span className="tabular-nums text-emerald-700">−₹{order.discount.toLocaleString("en-IN")}</span></div>}
        <div className="flex justify-between"><span className="text-[var(--admin-muted)]">Shipping</span><span className="tabular-nums">{order.shipping === 0 ? "Free" : `₹${order.shipping.toLocaleString("en-IN")}`}</span></div>
        <div className="flex justify-between border-t border-[var(--admin-border)] pt-2 font-semibold"><span>Total</span><span className="tabular-nums">₹{order.total.toLocaleString("en-IN")}</span></div>
      </div>

      {/* Tracking & Shipping */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-[var(--admin-muted)]">Shipping & Tracking</p>
        {order.trackingNumber && (
          <button type="button" onClick={() => { void navigator.clipboard.writeText(order.trackingNumber!); toast.success("Copied"); }}
            className="mb-2 inline-flex items-center gap-1.5 font-mono text-sm text-[var(--admin-accent)] hover:underline" title="Click to copy">
            {order.shippingCarrier ? `${order.shippingCarrier}: ` : ""}{order.trackingNumber} <Copy className="h-3 w-3" strokeWidth={1.75} />
          </button>
        )}
        <form className="space-y-2" onSubmit={async (e) => {
          e.preventDefault();
          if (!token || !trackingInput.trim()) return;
          await onUpdateStatus(order._id, "shipped", trackingInput.trim(), carrierInput.trim() || undefined);
        }}>
          <div className="flex gap-2">
            <AdminInput className="!mt-0 flex-1" placeholder="Carrier (e.g. BlueDart, DTDC)" value={carrierInput} onChange={(e) => setCarrierInput(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <AdminInput className="!mt-0 flex-1" placeholder="Tracking number" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} />
            <AdminButton type="submit" variant="secondary" size="sm">Save & Ship</AdminButton>
          </div>
        </form>
      </div>

      {/* Download Invoice */}
      <div>
        <AdminButton variant="secondary" size="sm" onClick={downloadInvoice}>
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Download Invoice
        </AdminButton>
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
