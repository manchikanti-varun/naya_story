import mongoose from "mongoose";

const ProcessedWebhookSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, enum: ["stripe", "razorpay"] },
    externalId: { type: String, required: true },
    eventType: { type: String },
    receivedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

// Unique idempotency key per source
ProcessedWebhookSchema.index({ source: 1, externalId: 1 }, { unique: true });

/**
 * TTL index: automatically delete webhook records after 90 days.
 * This prevents unbounded collection growth (~3 webhooks per order × 1000 orders/day = ~1M/year).
 * 90 days is more than enough for dispute resolution and reconciliation.
 */
ProcessedWebhookSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ProcessedWebhook =
  mongoose.models.ProcessedWebhook ||
  mongoose.model("ProcessedWebhook", ProcessedWebhookSchema);
