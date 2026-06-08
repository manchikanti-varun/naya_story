const DEV_JWT_PLACEHOLDER = "dev-insecure-change-me";
const DEV_MONGO_DEFAULT = "mongodb://127.0.0.1:27017/naya-studio";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Fail fast when the API is started with unsafe or missing secrets.
 * Call before `connectDb` / route registration.
 */
export function assertSafeProductionConfig(): void {
  if (!isProduction()) return;

  const jwt = process.env.JWT_SECRET?.trim();
  if (!jwt || jwt.length < 32) {
    console.error(
      "[env] Production requires JWT_SECRET (min 32 characters). Generate with: openssl rand -base64 48",
    );
    process.exit(1);
  }
  if (jwt === DEV_JWT_PLACEHOLDER) {
    console.error("[env] Production cannot use the default JWT_SECRET from .env.example.");
    process.exit(1);
  }

  const mongo = process.env.MONGODB_URI?.trim();
  if (!mongo) {
    console.error("[env] Production requires MONGODB_URI (e.g. MongoDB Atlas connection string).");
    process.exit(1);
  }
  if (mongo === DEV_MONGO_DEFAULT) {
    console.error("[env] Production cannot use the local dev MONGODB_URI default.");
    process.exit(1);
  }

  const origin = process.env.CLIENT_ORIGIN?.trim() ?? "";
  if (origin && !origin.includes("localhost") && !origin.startsWith("https://")) {
    console.error(
      "[env] Production CLIENT_ORIGIN must use https:// (except localhost for local prod builds).",
    );
    process.exit(1);
  }

  // Warn (don't block) about missing webhook secrets in production
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn(
      "[env] STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing. Stripe webhooks cannot verify signatures.",
    );
  }
  if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn(
      "[env] RAZORPAY_KEY_ID is set but RAZORPAY_WEBHOOK_SECRET is missing. Razorpay webhooks cannot verify signatures.",
    );
  }
}
