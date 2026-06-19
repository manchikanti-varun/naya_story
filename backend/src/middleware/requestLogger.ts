/**
 * Request logging middleware — logs every request with timing information.
 * Uses the structured logger for consistent output format.
 */
import type { RequestHandler } from "express";
import { logger } from "../lib/logger.js";

export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
  const start = Date.now();

  // Log after response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    const ctx = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.headers["user-agent"]?.slice(0, 200),
    };

    if (level === "error") {
      logger.error("request_completed", ctx);
    } else if (level === "warn") {
      logger.warn("request_completed", ctx);
    } else {
      logger.info("request_completed", ctx);
    }
  });

  next();
};
