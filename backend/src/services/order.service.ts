/**
 * Order service — handles order creation, retrieval, and status management.
 */
import { orderRepository } from "../repositories/order.repository.js";
import { couponRepository } from "../repositories/coupon.repository.js";
import { reserveStock, releaseStock } from "../lib/inventory.js";
import { resolveCoupon } from "../lib/coupon-utils.js";
import { validateTransition, allowedNextStatuses, type OrderStatus } from "../lib/order-status.js";
import { isMongoDuplicateKey } from "../lib/webhookIdempotency.js";
import { HttpError } from "../middleware/httpError.js";
import { Order } from "../models/Order.js";

function generateOrderNumber(): string {
  const n = Math.floor(Math.random() * 90000 + 10000);
  return `NS-${Date.now().toString(36).toUpperCase()}-${n}`;
}

export type CreateOrderInput = {
  items: { productId: string; sku: string; quantity: number }[];
  shippingAddress: Record<string, string>;
  couponCode?: string;
  guestEmail?: string;
  idempotencyKey?: string;
  paymentProvider?: "stripe" | "razorpay" | "cod";
  stripePaymentIntentId?: string;
  razorpayPaymentId?: string;
  userId?: string;
};

export const orderService = {
  async createOrder(input: CreateOrderInput) {
    const {
      items, shippingAddress, couponCode, guestEmail,
      idempotencyKey, paymentProvider = "stripe",
      stripePaymentIntentId, razorpayPaymentId, userId,
    } = input;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) return { order: existing, duplicate: true };
    }

    // Atomic stock reservation
    const reservation = await reserveStock(items);
    if (!reservation.success) {
      throw new HttpError(409, reservation.error);
    }

    const { items: reservedItems, subtotal } = reservation;

    // Coupon resolution
    const shipping = subtotal >= 15000 ? 0 : 299;
    const { discount, couponCode: appliedCoupon, coupon } = await resolveCoupon(couponCode, subtotal);
    const total = Math.max(0, subtotal + shipping - discount);

    // Order creation
    let doc;
    try {
      doc = await orderRepository.create({
        orderNumber: generateOrderNumber(),
        idempotencyKey: idempotencyKey || undefined,
        user: userId,
        guestEmail,
        items: reservedItems,
        subtotal,
        shipping,
        discount,
        total,
        couponCode: appliedCoupon,
        shippingAddress,
        timeline: [{ status: "pending", at: new Date() }],
        paymentProvider,
        paymentReference: undefined,
        stripePaymentIntentId: stripePaymentIntentId || undefined,
        razorpayPaymentId: razorpayPaymentId || undefined,
        status: "pending",
      });
    } catch (err) {
      if (isMongoDuplicateKey(err) && idempotencyKey) {
        const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
        if (existing) {
          await releaseStock(items.map((i) => ({ productId: i.productId, sku: i.sku, quantity: i.quantity })));
          return { order: existing, duplicate: true };
        }
      }
      await releaseStock(items.map((i) => ({ productId: i.productId, sku: i.sku, quantity: i.quantity })));
      throw err;
    }

    // Atomic coupon usage increment
    if (coupon) {
      await couponRepository.incrementUsage(coupon._id);
    }

    return { order: doc, duplicate: false };
  },

  async getOrdersByUser(userId: string) {
    return orderRepository.findByUser(userId);
  },

  async getOrderById(id: string, requesterId: string, requesterRole: string) {
    const order = await orderRepository.findByIdLean(id);
    if (!order) throw new HttpError(404, "Not found");

    const acl = order as { user?: unknown };
    if (acl.user && String(acl.user) !== requesterId && requesterRole !== "admin") {
      throw new HttpError(403, "Forbidden");
    }
    return order;
  },

  async getAllOrders(limit = 200) {
    return orderRepository.findAll(limit);
  },

  async transitionStatus(orderId: string, targetStatus: OrderStatus, trackingNumber?: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new HttpError(404, "Not found");

    const currentStatus = order.status as OrderStatus;
    const error = validateTransition(currentStatus, targetStatus);
    if (error) {
      throw new HttpError(422, error, {
        currentStatus,
        targetStatus,
        allowedTransitions: allowedNextStatuses(currentStatus),
      });
    }

    // If cancelling, release stock and decrement coupon
    if (targetStatus === "cancelled") {
      const stockItems = (order.items ?? []).map((item: { productId: unknown; sku: unknown; quantity: unknown }) => ({
        productId: String(item.productId),
        sku: String(item.sku),
        quantity: Number(item.quantity),
      }));
      await releaseStock(stockItems);

      if (order.couponCode) {
        await couponRepository.decrementUsage(order.couponCode);
      }
    }

    order.status = targetStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    order.timeline!.push({ status: targetStatus, at: new Date() });
    await order.save();

    return order;
  },
};
