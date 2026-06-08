import type { CorsOptions } from "cors";

/**
 * `CLIENT_ORIGIN` may be a single URL or comma-separated allowlist
 * (e.g. `https://www.example.com,https://admin.example.com`).
 *
 * Security: never allow all origins in production. In dev, falls back to
 * localhost:3000 so credentials aren't exposed to arbitrary origins.
 */
export function createCorsOptions(clientOrigin: string): CorsOptions {
  const origins = clientOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    // In production, reject all cross-origin requests when no origin is configured.
    // In development, default to localhost:3000.
    if (process.env.NODE_ENV === "production") {
      return {
        origin: false,
        credentials: true,
      };
    }
    return { origin: "http://localhost:3000", credentials: true };
  }

  if (origins.length === 1) {
    return { origin: origins[0], credentials: true };
  }

  return {
    origin(origin, cb) {
      // Allow server-to-server requests (no origin header)
      if (!origin) return cb(null, true);
      if (origins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed"));
    },
    credentials: true,
  };
}
