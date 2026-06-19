import { body } from "express-validator";

/**
 * Password complexity requirements for a luxury platform:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

export const registerRules = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters.")
    .matches(PASSWORD_REGEX)
    .withMessage(
      "Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    ),
  body("name").trim().notEmpty().isLength({ max: 100 }),
];

export const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

/** Validation for Firebase phone token exchange. */
export const phoneLoginRules = [
  body("idToken")
    .isString()
    .notEmpty()
    .withMessage("Firebase ID token is required.")
    .isLength({ max: 4096 })
    .withMessage("Token too long."),
];
