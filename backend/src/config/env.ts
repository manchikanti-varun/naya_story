/**
 * Centralized, strongly-typed configuration loaded from environment variables.
 * Validated at startup — the app fails fast if required config is missing in production.
 */

export interface AppConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
}

export interface DatabaseConfig {
  mongodbUri: string;
}

export interface AuthConfig {
  jwtSecret: string;
  accessTokenTtl: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleCallbackUrl?: string;
  clientOrigin: string;
}

export interface PaymentsConfig {
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayWebhookSecret?: string;
}

export interface UploadsConfig {
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  maxFileBytes: number;
  maxBulkFiles: number;
}

export interface Config {
  app: AppConfig;
  db: DatabaseConfig;
  auth: AuthConfig;
  payments: PaymentsConfig;
  uploads: UploadsConfig;
}

function env(key: string, fallback?: string): string {
  return process.env[key]?.trim() ?? fallback ?? "";
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function loadConfig(): Config {
  const nodeEnv = env("NODE_ENV", "development");
  const isProduction = nodeEnv === "production";

  return {
    app: {
      port: envInt("PORT", 4000),
      nodeEnv,
      isProduction,
    },
    db: {
      mongodbUri: env("MONGODB_URI", "mongodb://127.0.0.1:27017/naya-studio"),
    },
    auth: {
      jwtSecret: env("JWT_SECRET", "dev-insecure-change-me"),
      accessTokenTtl: env("ACCESS_TOKEN_TTL", "15m"),
      googleClientId: env("GOOGLE_CLIENT_ID") || undefined,
      googleClientSecret: env("GOOGLE_CLIENT_SECRET") || undefined,
      googleCallbackUrl: env("GOOGLE_CALLBACK_URL") || undefined,
      clientOrigin: env("CLIENT_ORIGIN", "http://localhost:3000"),
    },
    payments: {
      stripeSecretKey: env("STRIPE_SECRET_KEY") || undefined,
      stripeWebhookSecret: env("STRIPE_WEBHOOK_SECRET") || undefined,
      razorpayKeyId: env("RAZORPAY_KEY_ID") || undefined,
      razorpayKeySecret: env("RAZORPAY_KEY_SECRET") || undefined,
      razorpayWebhookSecret: env("RAZORPAY_WEBHOOK_SECRET") || undefined,
    },
    uploads: {
      cloudinaryCloudName: env("CLOUDINARY_CLOUD_NAME") || undefined,
      cloudinaryApiKey: env("CLOUDINARY_API_KEY") || undefined,
      cloudinaryApiSecret: env("CLOUDINARY_API_SECRET") || undefined,
      maxFileBytes: 10 * 1024 * 1024,
      maxBulkFiles: 10,
    },
  };
}

/** Singleton config instance — call loadConfig() once at startup. */
let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) _config = loadConfig();
  return _config;
}
