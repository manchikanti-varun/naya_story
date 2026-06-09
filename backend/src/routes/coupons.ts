import type { RequestHandler } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/httpError.js";
import { couponService } from "../services/coupon.service.js";
import { validateCouponRules, createCouponRules } from "../validators/coupon.validator.js";
import { handleValidationErrors } from "../validators/index.js";

export function createCouponsRouter(secret: string) {
  const r = Router();

  const couponValidateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many coupon validation attempts. Please try again later." },
  });

  // POST /validate — public coupon validation
  r.post(
    "/validate",
    couponValidateLimiter,
    ...validateCouponRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const { code, subtotal } = req.body as { code: string; subtotal: number };
      const result = await couponService.validate(code, subtotal);
      res.json(result);
    }),
  );

  // GET / — list all coupons (admin)
  r.get("/", ...(requireAdmin(secret) as RequestHandler[]), asyncHandler(async (_req, res) => {
    const coupons = await couponService.listAll();
    res.json({ coupons });
  }));

  // POST / — create coupon (admin)
  r.post(
    "/",
    ...(requireAdmin(secret) as RequestHandler[]),
    ...createCouponRules,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
      const coupon = await couponService.create(req.body);
      res.status(201).json({ coupon });
    }),
  );

  // PATCH /:id — update coupon (admin)
  r.patch("/:id", ...(requireAdmin(secret) as RequestHandler[]), asyncHandler(async (req, res) => {
    const coupon = await couponService.update(req.params.id, req.body);
    res.json({ coupon });
  }));

  // DELETE /:id — delete coupon (admin)
  r.delete("/:id", ...(requireAdmin(secret) as RequestHandler[]), asyncHandler(async (req, res) => {
    await couponService.delete(req.params.id);
    res.json({ ok: true });
  }));

  return r;
}
