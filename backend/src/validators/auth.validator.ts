import { body } from "express-validator";

export const registerRules = [
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  body("name").trim().notEmpty(),
];

export const loginRules = [
  body("email").isEmail(),
  body("password").notEmpty(),
];
