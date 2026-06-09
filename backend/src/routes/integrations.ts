import { Router } from "express";
import { body, validationResult } from "express-validator";
import Stripe from "stripe";

export function createIntegrationsRouter(env: {
  stripeSecret?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}) {
  const r = Router();

  // Lazy-initialize Stripe SDK only when secret is available
  let stripe: Stripe | null = null;
  function getStripe(): Stripe | null {
    if (!env.stripeSecret) return null;
    if (!stripe) stripe = new Stripe(env.stripeSecret);
    return stripe;
  }

  /**
   * POST /payments/create-intent
   * Creates a real Stripe PaymentIntent or Razorpay order.
   *
   * Body:
   *   amount: number (in smallest currency unit, e.g. paise for INR)
   *   currency: string (default "inr")
   *   provider: "stripe" | "razorpay" (default "stripe")
   *   orderId: string (optional — Naya order _id for webhook correlation)
   *   metadata: object (optional — passed to payment provider)
   */
  r.post(
    "/payments/create-intent",
    body("amount").isNumeric().custom((v) => Number(v) > 0),
    body("currency").optional().isString().isLength({ max: 10 }),
    body("provider").optional().isIn(["stripe", "razorpay"]),
    body("orderId").optional().isString().isLength({ max: 64 }),
    body("metadata").optional().isObject(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });

      const {
        amount,
        currency = "inr",
        provider = "stripe",
        orderId,
        metadata,
      } = req.body as {
        amount: number;
        currency?: string;
        provider?: "stripe" | "razorpay";
        orderId?: string;
        metadata?: Record<string, string>;
      };

      // Ensure amount is an integer (smallest currency unit)
      const amountInt = Math.round(Number(amount));
      if (amountInt <= 0) {
        return res.status(400).json({ message: "Amount must be a positive integer (smallest currency unit)." });
      }

      if (provider === "stripe") {
        const stripeClient = getStripe();
        if (!stripeClient) {
          return res.json({
            provider: "stripe",
            configured: false,
            clientSecret: null,
            amount: amountInt,
            currency,
            message: "Stripe is not configured. Set STRIPE_SECRET_KEY on the API server.",
          });
        }

        try {
          const intentMetadata: Record<string, string> = {
            ...(metadata ?? {}),
          };
          if (orderId) intentMetadata.orderId = orderId;

          const paymentIntent = await stripeClient.paymentIntents.create({
            amount: amountInt,
            currency: currency.toLowerCase(),
            metadata: intentMetadata,
            automatic_payment_methods: { enabled: true },
          });

          return res.json({
            provider: "stripe",
            configured: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stripe PaymentIntent creation failed";
          console.error(
            JSON.stringify({
              level: "error",
              msg: "stripe_create_intent_failed",
              error: message,
              amount: amountInt,
              currency,
            }),
          );
          return res.status(502).json({
            message: "Payment provider error",
            details: process.env.NODE_ENV !== "production" ? message : undefined,
          });
        }
      }

      // Razorpay — create order via API
      if (!env.razorpayKeyId || !env.razorpayKeySecret) {
        return res.json({
          provider: "razorpay",
          configured: false,
          orderId: null,
          amount: amountInt,
          currency,
          keyId: null,
          message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        });
      }

      try {
        // Razorpay Orders API
        const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
        const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: amountInt,
            currency: currency.toUpperCase(),
            notes: orderId ? { orderId, ...(metadata ?? {}) } : (metadata ?? {}),
          }),
        });

        if (!razorpayRes.ok) {
          const text = await razorpayRes.text();
          console.error(
            JSON.stringify({
              level: "error",
              msg: "razorpay_create_order_failed",
              status: razorpayRes.status,
              body: text,
            }),
          );
          return res.status(502).json({ message: "Payment provider error" });
        }

        const razorpayOrder = (await razorpayRes.json()) as {
          id: string;
          amount: number;
          currency: string;
        };

        return res.json({
          provider: "razorpay",
          configured: true,
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: env.razorpayKeyId,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Razorpay order creation failed";
        console.error(
          JSON.stringify({
            level: "error",
            msg: "razorpay_create_order_failed",
            error: message,
          }),
        );
        return res.status(502).json({ message: "Payment provider error" });
      }
    },
  );

  r.post(
    "/shipping/estimate",
    body("postalCode").optional().isString(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });

      const { subtotal = 0 } = req.body as { postalCode?: string; subtotal?: number };

      const fee = Number(subtotal) >= 15000 ? 0 : 299;
      res.json({
        provider: "shiprocket",
        fee,
        etaDays: fee === 0 ? 3 : 5,
        message:
          "Wire Shiprocket credentials on the API server to sync live carrier rates and AWBs.",
      });
    },
  );

  return r;
}
