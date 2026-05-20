import mongoose from "mongoose";

const LegalPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    body: { type: String, default: "" },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

LegalPageSchema.index({ published: 1, order: 1 });

export const LegalPage =
  mongoose.models.LegalPage || mongoose.model("LegalPage", LegalPageSchema);
