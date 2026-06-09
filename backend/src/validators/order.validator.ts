import { body } from "express-validator";

export const createOrderRules = [
  body("items").isArray({ min: 1, max: 50 }),
  body("shippingAddress").isObject(),
  body("shippingAddress.line1").trim().notEmpty().isLength({ max: 200 }),
  body("shippingAddress.city").trim().notEmpty().isLength({ max: 100 }),
  body("shippingAddress.state").trim().notEmpty().isLength({ max: 100 }),
  body("shippingAddress.postalCode").trim().notEmpty().isLength({ max: 20 }),
  body("shippingAddress.country").trim().notEmpty().isLength({ max: 100 }),
  body("items.*.productId").notEmpty(),
  body("items.*.sku").notEmpty(),
  body("items.*.quantity").isInt({ min: 1, max: 50 }),
  body("guestEmail").optional().isEmail().normalizeEmail(),
  body("couponCode").optional().trim().isLength({ max: 50 }),
  body("idempotencyKey").optional().trim().isLength({ min: 1, max: 128 }),
  body("paymentProvider").optional().isIn(["stripe", "razorpay", "cod"]),
  body("stripePaymentIntentId").optional().trim().isLength({ max: 255 }),
  body("razorpayPaymentId").optional().trim().isLength({ max: 255 }),
];

export const updateStatusRules = [
  body("status").notEmpty().isIn(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"]),
];
