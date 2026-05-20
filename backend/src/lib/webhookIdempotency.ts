import { ProcessedWebhook } from "../models/ProcessedWebhook.js";

export function isMongoDuplicateKey(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && (err as { code?: number }).code === 11000);
}

/**
 * Record first receipt of a webhook idempotency key. Returns `duplicate` if already processed (safe retry).
 */
export async function claimWebhookEvent(
  source: "stripe" | "razorpay",
  externalId: string,
  eventType?: string,
): Promise<"new" | "duplicate"> {
  try {
    await ProcessedWebhook.create({ source, externalId, eventType });
    return "new";
  } catch (err) {
    if (isMongoDuplicateKey(err)) return "duplicate";
    throw err;
  }
}
