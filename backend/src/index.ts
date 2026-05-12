import "dotenv/config";
import cors from "cors";
import express from "express";
import passport from "passport";
import { connectDb } from "./config/db.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAuthRouter } from "./routes/auth.js";
import { createContentRouter } from "./routes/content.js";
import { createCouponsRouter } from "./routes/coupons.js";
import { createIntegrationsRouter } from "./routes/integrations.js";
import { createMediaRouter } from "./routes/media.js";
import { createOrdersRouter } from "./routes/orders.js";
import { createProductsRouter } from "./routes/products.js";
import { createUsersRouter } from "./routes/users.js";

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/naya-studio";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-insecure-change-me";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

async function main() {
  await connectDb(MONGODB_URI);

  const app = express();
  app.use(
    cors({
      origin: CLIENT_ORIGIN,
      credentials: true,
    }),
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
  app.use(
    "/api/integrations",
    createIntegrationsRouter({
      stripeSecret: process.env.STRIPE_SECRET_KEY,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    }),
  );

  app.use((_req, res) => res.status(404).json({ message: "Not found" }));

  app.listen(PORT, () => {
    console.log(`Naya API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
