import mongoose from "mongoose";

const MediaAssetSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    tags: [{ type: String }],
    category: { type: String, default: "general" },
  },
  { timestamps: true },
);

MediaAssetSchema.index({ name: "text", tags: "text", category: "text" });

export const MediaAsset =
  mongoose.models.MediaAsset || mongoose.model("MediaAsset", MediaAssetSchema);
