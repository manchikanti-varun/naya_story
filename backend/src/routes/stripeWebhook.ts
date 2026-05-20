import type { Request, Response } from "express";
import Stripe from "stripe";
import { claimWebhookEvent } from "../lib/webhookIdempotency.js";

/**
 * Stripe webhook — raw body. Idempotent by `event.id` (safe retries).
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

  console.log(
    JSON.stringify({
      level: "info",
      msg: "stripe_webhook",
      type: event.type,
      id: event.id,
      requestId: req.requestId,
    }),
  );

  res.status(200).json({ received: true, type: event.type, id: event.id });
}
