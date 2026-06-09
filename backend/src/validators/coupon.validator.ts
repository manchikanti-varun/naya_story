import { body } from "express-validator";

export const validateCouponRules = [
  body("code").trim().notEmpty().isLength({ max: 50 }),
  body("subtotal").isNumeric(),
];

export const createCouponRules = [
  body("code").notEmpty(),
  body("type").isIn(["percent", "fixed"]),
  body("value").isNumeric(),
];
