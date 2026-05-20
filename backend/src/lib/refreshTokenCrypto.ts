import crypto from "node:crypto";

export function generateRefreshRaw(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashRefreshToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}
