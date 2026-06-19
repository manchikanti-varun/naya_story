import mongoose from "mongoose";

/**
 * SiteSettings stores the singleton configuration for the storefront.
 *
 * NOTE: `homepage` and `homepageDraft` use Mixed intentionally because the
 * HomepageConfig shape is complex and managed entirely through typed merging
 * functions (mergeHomepageConfig). Mongoose schema validation is not applied
 * to these fields — validation happens at the application layer.
 *
 * `storefront` is similarly dynamic but simpler; it uses Mixed with a typed
 * merge function (mergeStorefrontSettings) for safety.
 *
 * The `minimize: false` option prevents Mongoose from stripping empty objects
 * (e.g. `{}` for a freshly-initialized homepage), which would break merging.
 */

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    image: { type: String, default: "" },
    href: { type: String, default: "" },
    placement: { type: String, default: "" },
  },
  { _id: false },
);

const SiteSettingsSchema = new mongoose.Schema(
  {
    /** Live storefront homepage (published). */
    homepage: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    /** Admin working copy; when null, editor starts from `homepage`. */
    homepageDraft: { type: mongoose.Schema.Types.Mixed, default: null },
    homepagePublishedAt: { type: Date, default: null },
    homepageCmsVersion: { type: Number, default: 0 },
    banners: { type: [BannerSchema], default: () => [] },
    /** PDP size chart, suggested-products mode, payment toggles, etc. */
    storefront: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  {
    timestamps: true,
    minimize: false, // Preserve empty objects for merge functions
  },
);

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", SiteSettingsSchema);
