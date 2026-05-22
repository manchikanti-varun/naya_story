/**
 * One-time cleanup: remove Unsplash URLs from SiteSettings + Products in MongoDB.
 * Run: npm run strip-unsplash (from backend/)
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { mergeHomepageConfig } from "../lib/homepage-defaults.js";
import { sanitizeProductMedia } from "../lib/strip-unsplash.js";
import { Product } from "../models/Product.js";
import { SiteSettings } from "../models/SiteSettings.js";
import type { HomepageConfig } from "../types/homepage.js";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/naya-studio";

type SettingsLean = {
  homepage?: unknown;
  homepageDraft?: unknown;
};

async function main() {
  await connectDb(MONGODB_URI);

  const settings = (await SiteSettings.findOne().lean()) as SettingsLean | null;
  if (settings) {
    const homepage = mergeHomepageConfig(settings.homepage as Partial<HomepageConfig>);
    const homepageDraft = mergeHomepageConfig(
      (settings.homepageDraft ?? settings.homepage) as Partial<HomepageConfig>,
    );
    await SiteSettings.updateOne({}, { $set: { homepage, homepageDraft } });
    console.log("SiteSettings homepage + draft sanitized.");
  }

  const products = await Product.find({}).lean();
  let updated = 0;
  for (const p of products) {
    const row = p as Record<string, unknown> & { _id: unknown };
    const clean = sanitizeProductMedia(row);
    const before = JSON.stringify(row.images);
    const after = JSON.stringify(clean.images);
    const hoverImage = typeof clean.hoverImage === "string" ? clean.hoverImage : "";
    const newInHoverImage =
      typeof clean.newInHoverImage === "string" ? clean.newInHoverImage : "";
    if (
      before !== after ||
      row.hoverImage !== hoverImage ||
      row.newInHoverImage !== newInHoverImage
    ) {
      await Product.updateOne(
        { _id: row._id },
        {
          $set: {
            images: clean.images,
            hoverImage: hoverImage || undefined,
            newInHoverImage: newInHoverImage || undefined,
          },
        },
      );
      updated += 1;
    }
  }
  console.log(`Products updated: ${updated} / ${products.length}`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
