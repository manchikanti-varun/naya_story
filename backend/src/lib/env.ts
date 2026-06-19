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
  // JWT_SECRET is ALWAYS required — never allow a fallback
  const jwt = process.env.JWT_SECRET?.trim();
  if (!jwt || jwt.length < 32) {
    console.error(
      "[env] JWT_SECRET is required (min 32 characters). Generate with: openssl rand -base64 48",
    );
    process.exit(1);
  }
  if (jwt === DEV_JWT_PLACEHOLDER || jwt === "replace-me-with-a-random-string-at-least-32-chars") {
    console.error("[env] Cannot start with the default JWT_SECRET from .env.example. Set a unique value.");
    process.exit(1);
  }

  if (!isProduction()) return;

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
  if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn(
      "[env] RAZORPAY_KEY_ID is set but RAZORPAY_WEBHOOK_SECRET is missing. Razorpay webhooks cannot verify signatures.",
    );
  }

  // Warn about missing Redis in production (critical for rate limiting + account lockout in multi-instance)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn(
      "[env] UPSTASH_REDIS_REST_URL is not set. Rate limiting and account lockout will use in-memory storage (not shared across instances). This is a security risk in multi-instance/cluster deployments.",
    );
  }
}
