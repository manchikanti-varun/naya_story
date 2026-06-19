import { Router } from "express";
import { body, validationResult } from "express-validator";
import { settingsRepository } from "../repositories/settings.repository.js";
import { mergeStorefrontSettings } from "../lib/storefront-settings.js";

export function createIntegrationsRouter(env: {
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}) {
  const r = Router();

  // GET /payment-methods — returns available payment methods for the storefront
  r.get("/payment-methods", async (_req, res) => {
    const methods: { id: string; name: string; enabled: boolean }[] = [];

    // Read payment config from database
    let paymentConfig: { codEnabled?: boolean; razorpayEnabled?: boolean } = {};
    try {
      const doc = await settingsRepository.findOne();
      const storefront = mergeStorefrontSettings(doc?.storefront);
      paymentConfig = (storefront as { paymentMethods?: typeof paymentConfig }).paymentMethods ?? {};
    } catch { /* use defaults */ }

    if (env.razorpayKeyId && env.razorpayKeySecret) {
      methods.push({ id: "razorpay", name: "UPI / Cards / Netbanking / Wallets / EMI", enabled: paymentConfig.razorpayEnabled !== false });
    }

    const codEnabled = paymentConfig.codEnabled === true;
    methods.push({ id: "cod", name: "Cash on Delivery", enabled: codEnabled });

    res.json({ methods });
  });

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
