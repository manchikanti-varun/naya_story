import mongoose from "mongoose";

const SiteSettingsSchema = new mongoose.Schema(
  {
    homepage: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
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
