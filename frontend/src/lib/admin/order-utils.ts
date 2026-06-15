import type { Order } from "@/types";

export function formatOrderStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    packed: "Packed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    return_requested: "Return Requested",
    return_approved: "Return Approved",
    refunded: "Refunded",
  };
  return labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

export function orderStatusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "delivered") return "success";
  if (status === "shipped" || status === "packed" || status === "confirmed") return "neutral";
  if (status === "pending") return "warning";
  if (status === "cancelled" || status === "refunded") return "danger";
  if (status === "return_requested" || status === "return_approved") return "warning";
  return "neutral";
}

export function orderCustomerLabel(o: Order) {
  if (o.guestEmail?.trim()) return o.guestEmail.trim();
  const city = o.shippingAddress?.city?.trim();
  const state = o.shippingAddress?.state?.trim();
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  return "Guest";
}

export function orderItemCount(o: Order) {
  return o.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
}

export function orderItemsPreview(o: Order) {
  if (!o.items.length) return "—";
  const first = o.items[0]!.name;
  if (o.items.length === 1) return first;
  return `${first} +${o.items.length - 1} more`;
}
