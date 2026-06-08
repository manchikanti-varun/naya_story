import type { RequestHandler } from "express";

/**
 * Strip dangerous keys (__proto__, constructor, prototype) from request bodies
 * to prevent prototype pollution attacks via JSON payloads.
 */
function stripDangerousKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripDangerousKeys);
  if (Buffer.isBuffer(obj)) return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    result[key] = stripDangerousKeys(value);
  }
  return result;
}

/**
 * Express middleware that sanitizes JSON request bodies against prototype pollution.
 * Should be registered after express.json() but before route handlers.
 */
export const sanitizeBodyMiddleware: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    req.body = stripDangerousKeys(req.body);
  }
  next();
};
