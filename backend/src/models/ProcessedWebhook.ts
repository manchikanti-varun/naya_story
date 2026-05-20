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

ProcessedWebhookSchema.index({ source: 1, externalId: 1 }, { unique: true });

export const ProcessedWebhook =
  mongoose.models.ProcessedWebhook ||
  mongoose.model("ProcessedWebhook", ProcessedWebhookSchema);
