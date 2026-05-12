import { Router } from "express";
import { body, validationResult } from "express-validator";

export function createIntegrationsRouter(env: {
  stripeSecret?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}) {
  const r = Router();

  r.post(
    "/payments/create-intent",
    body("amount").isNumeric(),
    body("currency").optional().isString(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });

      const { amount, currency = "inr", provider = "stripe" } = req.body as {
        amount: number;
        currency?: string;
        provider?: "stripe" | "razorpay";
      };

      if (provider === "stripe") {
        return res.json({
          provider: "stripe",
          configured: Boolean(env.stripeSecret),
          clientSecret: env.stripeSecret ? "stripe_secret_from_server" : "demo_client_secret",
          amount,
          currency,
          message: env.stripeSecret
            ? undefined
            : "Set STRIPE_SECRET_KEY on the API server for live Stripe intents.",
        });
      }

      return res.json({
        provider: "razorpay",
        configured: Boolean(env.razorpayKeyId && env.razorpayKeySecret),
        orderId: `demo_order_${Date.now()}`,
        amount,
        currency,
        keyId: env.razorpayKeyId ?? "rzp_test_placeholder",
        message:
          env.razorpayKeyId && env.razorpayKeySecret
            ? undefined
            : "Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for live checkout.",
      });
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
