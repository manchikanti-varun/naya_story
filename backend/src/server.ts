/**
 * Express application factory — creates and configures the Express app.
 * Separated from the entry point for testability.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import passport from "passport";
import { createCorsOptions } from "./lib/cors-config.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAuthRouter } from "./routes/auth.js";
import { createContentRouter } from "./routes/content.js";
import { createCouponsRouter } from "./routes/coupons.js";
import { createIntegrationsRouter } from "./routes/integrations.js";
import { createLegalPagesRouter } from "./routes/legalPages.js";
import { createMediaRouter } from "./routes/media.js";
import { createOrdersRouter } from "./routes/orders.js";
import { createPaymentRouter } from "./routes/payment.js";
import { createProductsRouter } from "./routes/products.js";
import { createReviewsRouter } from "./routes/reviews.js";
import { createUsersRouter } from "./routes/users.js";
import { createInvoicesRouter } from "./routes/invoices.js";
import { razorpayWebhookHandler } from "./routes/razorpayWebhook.js";
import { errorHandler } from "./middleware/httpError.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLoggerMiddleware } from "./middleware/requestLogger.js";
import { sanitizeBodyMiddleware } from "./middleware/sanitizeBody.js";
import type { Config } from "./config/env.js";

export function createApp(config: Config): express.Express {
  const app = express();

  // --- Core middleware ---
  if (config.app.isProduction) {
    app.set("trust proxy", 1);
  }
  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);
  // Split CLIENT_ORIGIN (may be comma-separated) into individual origins for CSP
  const clientOrigins = config.auth.clientOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: config.app.isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "https://checkout.razorpay.com"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.razorpay.com"],
              connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com", ...clientOrigins],
              frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
              fontSrc: ["'self'", "https://fonts.gstatic.com"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      hsts: config.app.isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );
  app.use(cors(createCorsOptions(config.auth.clientOrigin)));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(cookieParser());

  // Security: prevent browsers from caching authenticated API responses
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // --- Webhooks (require raw body, registered before express.json) ---
  app.post(
    "/api/integrations/webhooks/razorpay",
    express.json({
      limit: "4mb",
      verify: (req, _res, buf) => {
        (req as Request).rawBody = buf;
      },
    }),
    (req, res, next) => {
      void razorpayWebhookHandler(req as Request, res as Response).catch(next);
    },
  );

  // --- Body parsing ---
  app.use(express.json({ limit: "4mb" }));
  app.use(sanitizeBodyMiddleware);
  app.use(passport.initialize());

  // --- Health check ---
  app.get("/api/health", (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbOk = dbState === 1;
    res.status(dbOk ? 200 : 503).json({
      ok: dbOk,
      db: dbOk ? "connected" : `state=${dbState}`,
      uptime: Math.floor(process.uptime()),
    });
  });

  // --- Routes ---
  const jwtSecret = config.auth.jwtSecret;

  app.use(
    "/api/auth",
    createAuthRouter({
      jwtSecret,
      googleClientId: config.auth.googleClientId,
      googleClientSecret: config.auth.googleClientSecret,
      googleCallbackUrl: config.auth.googleCallbackUrl,
      clientOrigin: config.auth.clientOrigin,
    }),
  );

  app.use("/api/reviews", createReviewsRouter(jwtSecret));
  app.use("/api/products", createProductsRouter(jwtSecret));
  app.use("/api/orders", createOrdersRouter(jwtSecret));
  app.use("/api/users", createUsersRouter(jwtSecret));
  app.use("/api/admin", createAdminRouter(jwtSecret));
  app.use("/api/media", createMediaRouter(jwtSecret));
  app.use("/api/coupons", createCouponsRouter(jwtSecret));
  app.use("/api/content", createContentRouter(jwtSecret));
  app.use("/api/legal-pages", createLegalPagesRouter(jwtSecret));
  app.use("/api/invoices", createInvoicesRouter(jwtSecret));
  app.use("/api/payment", createPaymentRouter(jwtSecret));
  app.use(
    "/api/integrations",
    createIntegrationsRouter({
      razorpayKeyId: config.payments.razorpayKeyId,
      razorpayKeySecret: config.payments.razorpayKeySecret,
    }),
  );

  // --- 404 + error handler ---
  app.use((_req, res) => res.status(404).json({ message: "Not found" }));
  app.use(errorHandler);

  return app;
}
