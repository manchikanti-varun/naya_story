import type { CorsOptions } from "cors";

/**
 * `CLIENT_ORIGIN` may be a single URL or comma-separated allowlist
 * (e.g. `https://www.example.com,https://admin.example.com`).
 */
export function createCorsOptions(clientOrigin: string): CorsOptions {
  const origins = clientOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    return { origin: true, credentials: true };
  }
  if (origins.length === 1) {
    return { origin: origins[0], credentials: true };
  }
  return {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (origins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  };
}
