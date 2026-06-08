import type { RequestHandler } from "express";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import { Coupon } from "../models/Coupon.js";
import { requireAdmin } from "../middleware/auth.js";
import { resolveCoupon } from "../lib/coupon-utils.js";

export function createCouponsRouter(secret: string) {
  const r = Router();

  // Rate limit coupon validation to prevent brute-forcing codes (30 per 15 min per IP)
  const couponValidateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many coupon validation attempts. Please try again later." },
  });

  r.post(
    "/validate",
    couponValidateLimiter,
    body("code").trim().notEmpty().isLength({ max: 50 }),
    body("subtotal").isNumeric(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      }
      const { code, subtotal } = req.body as { code: string; subtotal: number };
      const { discount, couponCode } = await resolveCoupon(code, Number(subtotal));
      if (!couponCode) {
        return res.json({ valid: false, discount: 0, code: null });
      }
      return res.json({ valid: true, discount, code: couponCode });
    },
  );

  r.get("/", ...(requireAdmin(secret) as RequestHandler[]), async (_req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ coupons });
  });

  r.post(
    "/",
    ...(requireAdmin(secret) as RequestHandler[]),
    body("code").notEmpty(),
    body("type").isIn(["percent", "fixed"]),
    body("value").isNumeric(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      try {
        const doc = await Coupon.create({
          ...req.body,
          code: String(req.body.code).toUpperCase(),
        });
        res.status(201).json({ coupon: doc });
      } catch (e) {
        res.status(400).json({ message: (e as Error).message });
      }
    },
  );

  r.patch("/:id", ...(requireAdmin(secret) as RequestHandler[]), async (req, res) => {
    // Whitelist allowed fields to prevent MongoDB operator injection
    const allowedFields = ["code", "type", "value", "expiresAt", "usageLimit", "active"];
    const rawBody = req.body as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in rawBody) sanitized[key] = rawBody[key];
    }
    if (sanitized.code) sanitized.code = String(sanitized.code).toUpperCase();
    const doc = await Coupon.findByIdAndUpdate(req.params.id, sanitized, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ coupon: doc });
  });

  r.delete("/:id", ...(requireAdmin(secret) as RequestHandler[]), async (req, res) => {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  return r;
}
