import type { RequestHandler } from "express";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Coupon } from "../models/Coupon.js";
import { requireAdmin } from "../middleware/auth.js";
import { resolveCoupon } from "../lib/coupon-utils.js";

export function createCouponsRouter(secret: string) {
  const r = Router();

  r.post(
    "/validate",
    body("code").trim().notEmpty(),
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
    const doc = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ coupon: doc });
  });

  r.delete("/:id", ...(requireAdmin(secret) as RequestHandler[]), async (req, res) => {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  return r;
}
