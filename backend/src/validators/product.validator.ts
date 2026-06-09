import { body } from "express-validator";

export const createProductRules = [
  body("name").notEmpty(),
  body("slug").notEmpty(),
  body("description").notEmpty(),
  body("price").isNumeric(),
  body("category").notEmpty(),
  body("images").isArray({ min: 1 }),
  body("variants").isArray({ min: 1 }),
];
