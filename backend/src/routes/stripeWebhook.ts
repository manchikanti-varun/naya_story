import type { Request, Response } from "express";
import Stripe from "stripe";
import { claimWebhookEvent } from "../lib/webhookIdempotency.js";
import { Order } from "../models/Order.js";
import { validateTransition, type OrderStatus } from "../lib/order-status.js";
import { releaseStock } from "../lib/inventory.js";

/**
 * Transition an order's status via webhook (skips transitions that are no longer valid).
 * Returns the updated order or null if transition was skipped.
 */
async function transitionOrderStatus(
  order: InstanceType<typeof Order>,
  targetStatus: OrderStatus,
  paymentReference?: string,
): Promise<InstanceType<typeof Order> | null> {
  const current = order.status as OrderStatus;

  // If already at target status, skip (idempotent)
  if (current === targetStatus) return order;

  // Validate the transition is allowed
  const error = validateTransition(current, targetStatus);
  if (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "webhook_transition_skipped",
        orderId: String(order._id),
        from: current,
        to: targetStatus,
        reason: error,
      }),
    );
    return null;
  }

  order.status = targetStatus;
  if (paymentReference) order.paymentReference = paymentReference;
  order.timeline!.push({ status: targetStatus, at: new Date() });
  await order.save();
  return order;
}

/**
 * Find order by Stripe PaymentIntent ID.
 */
async function findOrderByPaymentIntent(
  paymentIntentId: string,
): Promise<InstanceType<typeof Order> | null> {
  return Order.findOne({ stripePaymentIntentId: paymentIntentId });
}

/**
 * Handle payment_intent.succeeded — confirm the order.
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent, requestId?: string): Promise<void> {
  const order = await findOrderByPaymentIntent(paymentIntent.id);
  if (!order) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "stripe_webhook_order_not_found",
        paymentIntentId: paymentIntent.id,
        requestId,
      }),
    );
    return;
  }

  await transitionOrderStatus(order, "confirmed", paymentIntent.id);
  // Mark payment as paid
  order.paymentStatus = "paid";
  await order.save();

  console.log(
    JSON.stringify({
      level: "info",
      msg: "stripe_payment_succeeded",
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      requestId,
    }),
  );
}

/**
 * Handle payment_intent.payment_failed — cancel the order and release stock.
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, requestId?: string): Promise<void> {
  const order = await findOrderByPaymentIntent(paymentIntent.id);
  if (!order) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "stripe_webhook_order_not_found",
        paymentIntentId: paymentIntent.id,
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
        msg: "stripe_payment_failed_order_not_cancellable",
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
  order.paymentStatus = "failed";
  order.timeline!.push({ status: "cancelled", at: new Date() });
  await order.save();

  console.log(
    JSON.stringify({
      level: "info",
      msg: "stripe_payment_failed_order_cancelled",
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentIntentId: paymentIntent.id,
      requestId,
    }),
  );
}

/**
 * Handle charge.refunded — log the refund event on the order timeline.
 */
async function handleChargeRefunded(charge: Stripe.Charge, requestId?: string): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "stripe_refund_no_payment_intent",
        chargeId: charge.id,
        requestId,
      }),
    );
    return;
  }

  const order = await findOrderByPaymentIntent(paymentIntentId);
  if (!order) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "stripe_webhook_order_not_found",
        paymentIntentId,
        chargeId: charge.id,
        requestId,
      }),
    );
    return;
  }

  // Record refund in timeline (don't change status — partial refunds are possible)
  order.timeline!.push({
    status: `refunded:${charge.amount_refunded}`,
    at: new Date(),
  });
  await order.save();

  console.log(
    JSON.stringify({
      level: "info",
      msg: "stripe_charge_refunded",
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      chargeId: charge.id,
      amountRefunded: charge.amount_refunded,
      requestId,
    }),
  );
}

/**
 * Stripe webhook handler — raw body for signature verification.
 * Processes: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded.
 * Idempotent by event.id (safe retries).
 */
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripeSecret || !webhookSecret) {
    res.status(503).json({ message: "Stripe webhooks are not configured on this server." });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string" || !sig) {
    res.status(400).json({ message: "Missing Stripe-Signature header" });
    return;
  }

  const stripe = new Stripe(stripeSecret);
  let event: Stripe.Event;
  try {
    const payload = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch {
    res.status(400).json({ message: "Invalid Stripe webhook signature" });
    return;
  }

  // Idempotency check
  try {
    const status = await claimWebhookEvent("stripe", event.id, event.type);
    if (status === "duplicate") {
      res.status(200).json({ received: true, duplicate: true, id: event.id });
      return;
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "stripe_webhook_idempotency",
        id: event.id,
        requestId: req.requestId,
        error: String(err),
      }),
    );
    res.status(500).json({ message: "Webhook persistence failed" });
    return;
  }

  // Process event by type
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent, req.requestId);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent, req.requestId);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge, req.requestId);
        break;
      }
      default:
        console.log(
          JSON.stringify({
            level: "info",
            msg: "stripe_webhook_unhandled_type",
            type: event.type,
            id: event.id,
            requestId: req.requestId,
          }),
        );
        break;
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "stripe_webhook_processing_error",
        type: event.type,
        id: event.id,
        requestId: req.requestId,
        error: String(err),
      }),
    );
    // Still return 200 — we already claimed the event. Processing failures are logged and
    // can be retried via manual reconciliation, not by asking Stripe to resend.
  }

  res.status(200).json({ received: true, type: event.type, id: event.id });
}
