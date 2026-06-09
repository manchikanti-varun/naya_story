import crypto from "node:crypto";
import type { Request, Response } from "express";
import { claimWebhookEvent } from "../lib/webhookIdempotency.js";
import { Order } from "../models/Order.js";
import { validateTransition, type OrderStatus } from "../lib/order-status.js";
import { releaseStock } from "../lib/inventory.js";

type RazorpayWebhookBody = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        status?: string;
        notes?: Record<string, string>;
      };
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        amount?: number;
        notes?: Record<string, string>;
      };
    };
    order?: { entity?: { id?: string } };
  };
};

function razorpayExternalId(body: unknown, raw: Buffer): string {
  const b = body as RazorpayWebhookBody;
  const id =
    b.payload?.payment?.entity?.id ??
    b.payload?.refund?.entity?.id ??
    b.payload?.order?.entity?.id ??
    (b.event ? `${b.event}` : null);
  if (id && !id.startsWith("evt_")) return String(id);
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Find order by Razorpay Payment ID (stored at checkout) or from payment notes.
 */
async function findOrderByRazorpayPayment(
  paymentId: string,
  notes?: Record<string, string>,
): Promise<InstanceType<typeof Order> | null> {
  // First try the indexed razorpayPaymentId field
  let order = await Order.findOne({ razorpayPaymentId: paymentId });
  if (order) return order;

  // Try looking up by orderId in notes (if client passed our order _id in notes)
  const orderIdFromNotes = notes?.orderId ?? notes?.order_id;
  if (orderIdFromNotes) {
    order = await Order.findById(orderIdFromNotes);
    if (order) {
      // Link for future lookups
      order.razorpayPaymentId = paymentId;
      await order.save();
      return order;
    }
  }

  return null;
}

/**
 * Handle payment.captured — confirm the order.
 */
async function handlePaymentCaptured(body: RazorpayWebhookBody, requestId?: string): Promise<void> {
  const payment = body.payload?.payment?.entity;
  if (!payment?.id) return;

  const order = await findOrderByRazorpayPayment(payment.id, payment.notes);
  if (!order) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "razorpay_webhook_order_not_found",
        paymentId: payment.id,
        requestId,
      }),
    );
    return;
  }

  const current = order.status as OrderStatus;

  // If already confirmed or beyond, skip
  if (current !== "pending") {
    console.log(
      JSON.stringify({
        level: "info",
        msg: "razorpay_payment_captured_already_progressed",
        orderId: String(order._id),
        currentStatus: current,
        requestId,
      }),
    );
    return;
  }

  const error = validateTransition(current, "confirmed");
  if (error) return;

  order.status = "confirmed";
  order.paymentReference = payment.id;
  order.timeline!.push({ status: "confirmed", at: new Date() });
  await order.save();

  console.log(
    JSON.stringify({
      level: "info",
      msg: "razorpay_payment_captured",
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      amount: payment.amount,
      requestId,
    }),
  );
}

/**
 * Handle payment.failed — cancel the order and release stock.
 */
async function handlePaymentFailed(body: RazorpayWebhookBody, requestId?: string): Promise<void> {
  const payment = body.payload?.payment?.entity;
  if (!payment?.id) return;

  const order = await findOrderByRazorpayPayment(payment.id, payment.notes);
  if (!order) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "razorpay_webhook_order_not_found",
        paymentId: payment.id,
        requestId,
      }),
    );
    return;
  }

  const current = order.status as OrderStatus;

  // Only cancel if still in a cancellable state
  if (current !== "pending" && current !== "confirmed") {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "razorpay_payment_failed_order_not_cancellable",
        orderId: String(order._id),
        currentStatus: current,
        requestId,
      }),
    );
    return;
  }

  // Release stock
  const stockItems = (order.items ?? []).map((item: { productId: unknown; sku: unknown; quantity: unknown }) => ({
    productId: String(item.productId),
    sku: String(item.sku),
    quantity: Number(item.quantity),
  }));
  await releaseStock(stockItems);

  order.status = "cancelled";
  order.timeline!.push({ status: "cancelled", at: new Date() });
  await order.save();

  console.log(
    JSON.stringify({
      level: "info",
      msg: "razorpay_payment_failed_order_cancelled",
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      requestId,
    }),
  );
}

/**
 * Handle refund.processed — record in timeline.
 */
async function handleRefundProcessed(body: RazorpayWebhookBody, requestId?: string): Promise<void> {
  const refund = body.payload?.refund?.entity;
  if (!refund?.payment_id) return;

  const order = await findOrderByRazorpayPayment(refund.payment_id, refund.notes);
  if (!order) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "razorpay_webhook_order_not_found",
        paymentId: refund.payment_id,
        refundId: refund.id,
        requestId,
      }),
    );
    return;
  }

  order.timeline!.push({
    status: `refunded:${refund.amount ?? 0}`,
    at: new Date(),
  });
  await order.save();

  console.log(
    JSON.stringify({
      level: "info",
      msg: "razorpay_refund_processed",
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      refundId: refund.id,
      amount: refund.amount,
      requestId,
    }),
  );
}

/**
 * Razorpay webhook handler.
 * Processes: payment.captured, payment.failed, refund.processed.
 * Requires `express.json({ verify })` so `req.rawBody` is populated.
 * Idempotent using payment/refund id.
 */
export async function razorpayWebhookHandler(req: Request, res: Response): Promise<void> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ message: "Razorpay webhooks are not configured on this server." });
    return;
  }

  const sig = req.headers["x-razorpay-signature"];
  if (typeof sig !== "string" || !sig) {
    res.status(400).json({ message: "Missing X-Razorpay-Signature header" });
    return;
  }

  const raw = req.rawBody;
  if (!Buffer.isBuffer(raw)) {
    res.status(400).json({ message: "Could not verify webhook body" });
    return;
  }

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  // Use timing-safe comparison to prevent timing attacks
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"))
  ) {
    res.status(400).json({ message: "Invalid Razorpay webhook signature" });
    return;
  }

  const body = req.body as RazorpayWebhookBody;
  const externalId = razorpayExternalId(body, raw);
  const eventType = body.event;

  // Idempotency check
  try {
    const status = await claimWebhookEvent("razorpay", externalId, eventType);
    if (status === "duplicate") {
      res.status(200).json({ received: true, duplicate: true, id: externalId });
      return;
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "razorpay_webhook_idempotency",
        requestId: req.requestId,
        error: String(err),
      }),
    );
    res.status(500).json({ message: "Webhook persistence failed" });
    return;
  }

  // Process event by type
  try {
    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(body, req.requestId);
        break;
      case "payment.failed":
        await handlePaymentFailed(body, req.requestId);
        break;
      case "refund.processed":
        await handleRefundProcessed(body, req.requestId);
        break;
      default:
        console.log(
          JSON.stringify({
            level: "info",
            msg: "razorpay_webhook_unhandled_type",
            event: eventType,
            id: externalId,
            requestId: req.requestId,
          }),
        );
        break;
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "razorpay_webhook_processing_error",
        event: eventType,
        id: externalId,
        requestId: req.requestId,
        error: String(err),
      }),
    );
    // Still return 200 — already claimed. Failures are logged for manual reconciliation.
  }

  res.status(200).json({ received: true, event: eventType, id: externalId });
}
