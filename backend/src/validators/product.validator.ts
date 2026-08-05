import { body } from "express-validator";

export const createProductRules = [
  body("name").notEmpty().isLength({ max: 200 }),
  body("slug").notEmpty().isLength({ max: 200 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase alphanumeric with hyphens"),
  body("description").notEmpty().isLength({ max: 50000 })
    .withMessage("Description must not exceed 50,000 characters"),
  body("price").isNumeric(),
  body("category").notEmpty().isLength({ max: 100 }),
  body("images").isArray({ min: 1, max: 20 }),
  body("variants").isArray({ min: 1, max: 100 }),
];

/**
 * Validation rules for PATCH /products/:id (admin update).
 * All fields are optional since it's a partial update, but when present, must be valid.
 */
export const updateProductRules = [
  body("name").optional().trim().notEmpty().isLength({ max: 200 }),
  body("slug").optional().trim().notEmpty().isLength({ max: 200 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Slug must be lowercase alphanumeric with hyphens"),
  body("description").optional().trim().notEmpty().isLength({ max: 50000 }),
  body("shortDescription").optional().trim().isLength({ max: 500 }),
  body("price").optional().isFloat({ min: 0, max: 10000000 })
    .withMessage("Price must be between 0 and 10,000,000"),
  body("compareAtPrice").optional({ values: "null" }).isFloat({ min: 0, max: 10000000 }),
  body("taxRate").optional().isFloat({ min: 0, max: 1 }),
  body("discountPercent").optional().isFloat({ min: 0, max: 100 }),
  body("category").optional().trim().notEmpty().isLength({ max: 100 }),
  body("subcategory").optional().trim().isLength({ max: 100 }),
  body("collection").optional().trim().isLength({ max: 100 }),
  body("tags").optional().isArray({ max: 30 }),
  body("tags.*").optional().isString().isLength({ max: 50 }),
  body("images").optional().isArray({ min: 1, max: 20 }),
  body("images.*").optional().isString().isURL().withMessage("Each image must be a valid URL"),
  body("variants").optional().isArray({ min: 1, max: 100 }),
  body("variants.*.sku").optional().notEmpty().isLength({ max: 50 }),
  body("variants.*.size").optional().notEmpty().isLength({ max: 20 }),
  body("variants.*.color").optional().notEmpty().isLength({ max: 50 }),
  body("variants.*.stock").optional().isInt({ min: 0, max: 100000 }),
  body("material").optional().trim().isLength({ max: 200 }),
  body("fitType").optional().trim().isLength({ max: 100 }),
  body("gstRate").optional().isFloat({ min: 0, max: 0.28 }),
  body("hsnCode").optional().trim().isLength({ max: 20 }),
  body("featured").optional().isBoolean(),
  body("bestseller").optional().isBoolean(),
  body("trending").optional().isBoolean(),
  body("newIn").optional().isBoolean(),
  body("storefrontVisible").optional().isBoolean(),
  body("displayOrder").optional().isInt({ min: 0 }),
  body("lowStockDisplay").optional().isIn(["show", "hide"]),
];
