/**
 * HTTP cache header middleware for public API responses.
 *
 * Sets Cache-Control to allow CDN and browser caching for read-only, public data.
 * Use on product listings, site settings, and other non-authenticated reads.
 *
 * Usage:
 *   r.get("/", publicCache(60), asyncHandler(...));
 */
import type { RequestHandler } from "express";

/**
 * Set Cache-Control: public with the given max-age (in seconds).
 * Also sets stale-while-revalidate for graceful background refresh at CDN layer.
 */
export function publicCache(maxAgeSeconds: number, staleWhileRevalidate = 30): RequestHandler {
  return (_req, res, next) => {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidate}`,
    );
    // Remove the global no-store header for this response
    res.removeHeader("Pragma");
    next();
  };
}

/**
 * Private cache for authenticated responses that should still benefit from browser caching.
 */
export function privateCache(maxAgeSeconds: number): RequestHandler {
  return (_req, res, next) => {
    res.setHeader("Cache-Control", `private, max-age=${maxAgeSeconds}`);
    res.removeHeader("Pragma");
    next();
  };
}
