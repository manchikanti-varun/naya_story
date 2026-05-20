import mongoose from "mongoose";

const HomepageRevisionSchema = new mongoose.Schema(
  {
    /** Matches `SiteSettings.homepageCmsVersion` at publish/rollback time. */
    cmsVersion: { type: Number, required: true, index: true },
    homepage: { type: mongoose.Schema.Types.Mixed, required: true },
    action: { type: String, required: true, enum: ["publish", "rollback"] },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

HomepageRevisionSchema.index({ createdAt: -1 });

export const HomepageRevision =
  mongoose.models.HomepageRevision ||
  mongoose.model("HomepageRevision", HomepageRevisionSchema);
