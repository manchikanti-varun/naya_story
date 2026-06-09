/**
 * Shared validation middleware for extracting validation results.
 */
import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { HttpError } from "../middleware/httpError.js";

/**
 * Middleware that checks express-validator results and throws HttpError if invalid.
 * Place after validation rule arrays in the middleware chain.
 */
export function handleValidationErrors(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(400, "Validation failed", { errors: errors.array() });
  }
  next();
}
