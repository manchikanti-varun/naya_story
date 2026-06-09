import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    body: { type: String, required: true, maxlength: 2000 },
    /** Moderation status — only "approved" reviews appear on the storefront. */
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// One review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
// Fast lookup for approved reviews on a product
ReviewSchema.index({ product: 1, status: 1, createdAt: -1 });

export const Review =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);
