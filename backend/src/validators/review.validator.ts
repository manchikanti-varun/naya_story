import { body, param } from "express-validator";

export const createReviewRules = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("body")
    .isString()
    .trim()
    .isLength({ min: 3, max: 2000 })
    .withMessage("Review body must be between 3 and 2000 characters"),
];

export const moderateReviewRules = [
  param("id").isMongoId().withMessage("Invalid review ID"),
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Status must be 'approved' or 'rejected'"),
];
