/**
 * CSRF protection for cookie-authenticated endpoints.
 *
 * Strategy: Double-Submit via custom header.
 * Browsers automatically send cookies on cross-origin requests (even with SameSite=Lax
 * for top-level POST navigations). However, browsers DO NOT allow cross-origin JavaScript
 * to set custom headers. By requiring a custom header (X-Requested-With), we ensure
 * the request originated from our own JavaScript.
 *
 * This is simpler and stateless compared to token-based CSRF, and is the same pattern
 * used by GitHub, Stripe Dashboard, etc.
 *
 * Apply to routes that rely on cookie-based authentication (refresh, logout).
 */
import type { RequestHandler } from "express";

const CSRF_HEADER = "x-requested-with";
const EXPECTED_VALUE = "XMLHttpRequest";

/**
 * Reject requests that lack the custom X-Requested-With header.
 * This header cannot be set cross-origin without CORS preflight approval.
 */
export const csrfProtection: RequestHandler = (req, res, next) => {
  // Only enforce on state-changing methods
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  const header = req.headers[CSRF_HEADER];
  if (header === EXPECTED_VALUE) {
    return next();
  }

  // Allow requests that use Bearer tokens (not cookie-dependent)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }

  return res.status(403).json({
    message: "CSRF validation failed. Include X-Requested-With: XMLHttpRequest header.",
  });
};
