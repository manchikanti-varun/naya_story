import mongoose from "mongoose";

const SiteSettingsSchema = new mongoose.Schema(
  {
    /** Live storefront homepage (published). */
    homepage: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    /** Admin working copy; when null, editor starts from `homepage`. */
    homepageDraft: { type: mongoose.Schema.Types.Mixed, default: null },
    homepagePublishedAt: { type: Date, default: null },
    homepageCmsVersion: { type: Number, default: 0 },
    banners: [
      {
        title: String,
        image: String,
        href: String,
        placement: String,
      },
    ],
  },
  { timestamps: true },
);

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", SiteSettingsSchema);
