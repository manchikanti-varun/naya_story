import "dotenv/config";
import "./lib/cloudinary-env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import passport from "passport";
import { connectDb } from "./config/db.js";
import { createCorsOptions } from "./lib/cors-config.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAuthRouter } from "./routes/auth.js";
import { createContentRouter } from "./routes/content.js";
import { createCouponsRouter } from "./routes/coupons.js";
import { createIntegrationsRouter } from "./routes/integrations.js";
import { createLegalPagesRouter } from "./routes/legalPages.js";
import { createMediaRouter } from "./routes/media.js";
import { createOrdersRouter } from "./routes/orders.js";
import { createProductsRouter } from "./routes/products.js";
import { createUsersRouter } from "./routes/users.js";
import { razorpayWebhookHandler } from "./routes/razorpayWebhook.js";
import { stripeWebhookHandler } from "./routes/stripeWebhook.js";
import { assertSafeProductionConfig } from "./lib/env.js";
import { errorHandler } from "./middleware/httpError.js";
import { requestIdMiddleware } from "./middleware/requestId.js";

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/naya-studio";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-insecure-change-me";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

async function main() {
  assertSafeProductionConfig();
  await connectDb(MONGODB_URI);

  const app = express();
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors(createCorsOptions(CLIENT_ORIGIN)));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(cookieParser());

  /** Stripe webhooks require the raw body for signature verification. */
  app.post(
    "/api/integrations/webhooks/stripe",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      void stripeWebhookHandler(req as Request, res as Response).catch(next);
    },
  );

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

  app.use(express.json({ limit: "4mb" }));
  app.use(passport.initialize());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use(
    "/api/auth",
    createAuthRouter({
      jwtSecret: JWT_SECRET,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
      googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
      clientOrigin: CLIENT_ORIGIN,
    }),
  );

  app.use("/api/products", createProductsRouter(JWT_SECRET));
  app.use("/api/orders", createOrdersRouter(JWT_SECRET));
  app.use("/api/users", createUsersRouter(JWT_SECRET));
  app.use("/api/admin", createAdminRouter(JWT_SECRET));
  app.use("/api/media", createMediaRouter(JWT_SECRET));
  app.use("/api/coupons", createCouponsRouter(JWT_SECRET));
  app.use("/api/content", createContentRouter(JWT_SECRET));
  app.use("/api/legal-pages", createLegalPagesRouter(JWT_SECRET));
  app.use(
    "/api/integrations",
    createIntegrationsRouter({
      stripeSecret: process.env.STRIPE_SECRET_KEY,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    }),
  );

  app.use((_req, res) => res.status(404).json({ message: "Not found" }));
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Naya API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
