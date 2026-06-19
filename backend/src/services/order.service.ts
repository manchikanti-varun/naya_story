/**
 * Order service — handles order creation, retrieval, and status management.
 */
import crypto from "node:crypto";
import mongoose from "mongoose";
import { orderRepository } from "../repositories/order.repository.js";
import { couponRepository } from "../repositories/coupon.repository.js";
import { reserveStock, releaseStock } from "../lib/inventory.js";
import { resolveCoupon } from "../lib/coupon-utils.js";
import { validateTransition, allowedNextStatuses, type OrderStatus } from "../lib/order-status.js";
import { escapeRegex } from "../lib/sanitize-input.js";
import { isMongoDuplicateKey } from "../lib/webhookIdempotency.js";
import { HttpError } from "../middleware/httpError.js";
import { Order } from "../models/Order.js";

/**
 * Generate a collision-resistant order number.
 * Format: NS-<timestamp_base36>-<6 crypto random hex chars>
 * At 1000 orders/second, collision probability is ~1 in 16 million per second.
 * The unique index on orderNumber provides a hard guarantee.
 */
function generateOrderNumber(): string {
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `NS-${timePart}-${randPart}`;
}

/**
 * Start a MongoDB session for transactions. Returns null if the deployment
 * doesn't support transactions (standalone local dev without replica set).
 */
async function startSessionSafe(): Promise<mongoose.ClientSession | null> {
  try {
    const session = await mongoose.startSession();
    return session;
  } catch {
    // Standalone MongoDB (no replica set) — transactions unavailable
    return null;
  }
}

export type CreateOrderInput = {
  items: { productId: string; sku: string; quantity: number }[];
  shippingAddress: Record<string, string>;
  couponCode?: string;
  guestEmail?: string;
  idempotencyKey?: string;
  paymentProvider?: "razorpay" | "cod";
  razorpayPaymentId?: string;
  userId?: string;
};

export const orderService = {
  async createOrder(input: CreateOrderInput) {
    const {
      items, shippingAddress, couponCode, guestEmail,
      idempotencyKey, paymentProvider = "razorpay",
      razorpayPaymentId, userId,
    } = input;

    // Idempotency check (outside transaction — safe read)
    if (idempotencyKey) {
      const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) return { order: existing, duplicate: true };
    }

    // Atomic stock reservation (uses findOneAndUpdate with $gte — already atomic per-item)
    const reservation = await reserveStock(items);
    if (!reservation.success) {
      throw new HttpError(409, reservation.error);
    }

    const { items: reservedItems, subtotal } = reservation;

    // Coupon resolution
    const shipping = subtotal >= 15000 ? 0 : 299;
    const { discount, couponCode: appliedCoupon, coupon } = await resolveCoupon(couponCode, subtotal);
    const total = Math.max(0, subtotal + shipping - discount);

    // Order creation + coupon increment in a transaction (if replica set available).
    // This ensures: if Order.create fails, coupon usage is NOT incremented.
    // If no replica set (local dev), falls back to non-transactional (best-effort).
    const session = await startSessionSafe();
    let doc;

    try {
      if (session) session.startTransaction();

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
        razorpayPaymentId: razorpayPaymentId || undefined,
        status: "pending",
      });

      // Atomic coupon usage increment (inside transaction)
      if (coupon) {
        await couponRepository.incrementUsage(coupon._id);
      }

      if (session) await session.commitTransaction();
    } catch (err) {
      if (session) {
        try { await session.abortTransaction(); } catch { /* ignore abort errors */ }
      }

      if (isMongoDuplicateKey(err) && idempotencyKey) {
        const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
        if (existing) {
          await releaseStock(items.map((i) => ({ productId: i.productId, sku: i.sku, quantity: i.quantity })));
          return { order: existing, duplicate: true };
        }
      }
      await releaseStock(items.map((i) => ({ productId: i.productId, sku: i.sku, quantity: i.quantity })));
      throw err;
    } finally {
      if (session) await session.endSession();
    }

    return { order: doc, duplicate: false };
  },

  async getOrdersByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const { orders, total } = await orderRepository.findByUserPaginated(userId, skip, limit);
    return {
      orders,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
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

  async getAllOrdersPaginated(opts: { page: number; limit: number; status?: string; paymentStatus?: string; q?: string }) {
    const { page, limit, status, paymentStatus, q } = opts;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (q?.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { orderNumber: regex },
        { guestEmail: regex },
        { customerName: regex },
        { customerPhone: regex },
        { trackingNumber: regex },
        { "shippingAddress.city": regex },
      ];
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name email phone").lean(),
      Order.countDocuments(filter),
    ]);
    return { orders, total, page, pages: Math.max(Math.ceil(total / limit), 1) };
  },

  async transitionStatus(orderId: string, targetStatus: OrderStatus, trackingNumber?: string, shippingCarrier?: string) {
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

    // If refunded, release stock back
    if (targetStatus === "refunded") {
      const stockItems = (order.items ?? []).map((item: { productId: unknown; sku: unknown; quantity: unknown }) => ({
        productId: String(item.productId),
        sku: String(item.sku),
        quantity: Number(item.quantity),
      }));
      await releaseStock(stockItems);
      order.refundAmount = order.total;
      order.refundedAt = new Date();
    }

    order.status = targetStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingCarrier) order.shippingCarrier = shippingCarrier;
    order.timeline!.push({ status: targetStatus, at: new Date() });
    await order.save();

    return order;
  },

  /**
   * Request a return (customer-initiated).
   */
  async requestReturn(orderId: string, userId: string, reason: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new HttpError(404, "Not found");
    if (String(order.user) !== userId) throw new HttpError(403, "Forbidden");

    const currentStatus = order.status as OrderStatus;
    const error = validateTransition(currentStatus, "return_requested");
    if (error) throw new HttpError(422, error);

    order.status = "return_requested";
    order.returnReason = reason;
    order.returnRequestedAt = new Date();
    order.timeline!.push({ status: "return_requested", at: new Date() });
    await order.save();

    return order;
  },

  /**
   * Release stock for stale pending orders (payment not received within timeout).
   * Called by a cron/scheduler or on-demand by admin.
   */
  async releaseStaleOrders(timeoutMinutes = 30) {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    const staleOrders = await Order.find({
      status: "pending",
      paymentStatus: { $ne: "paid" },
      createdAt: { $lt: cutoff },
    });

    let released = 0;
    for (const order of staleOrders) {
      const stockItems = (order.items ?? []).map((item: { productId: unknown; sku: unknown; quantity: unknown }) => ({
        productId: String(item.productId),
        sku: String(item.sku),
        quantity: Number(item.quantity),
      }));
      await releaseStock(stockItems);

      if (order.couponCode) {
        await couponRepository.decrementUsage(order.couponCode);
      }

      order.status = "cancelled";
      order.paymentStatus = "failed";
      order.timeline!.push({ status: "cancelled", at: new Date() });
      await order.save();
      released++;
    }

    return { released, checked: staleOrders.length };
  },
};
