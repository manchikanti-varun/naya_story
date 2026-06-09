import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true },
    expiresAt: Date,
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Compound index for coupon validation lookup
CouponSchema.index({ code: 1, active: 1 });

export const Coupon =
  mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
