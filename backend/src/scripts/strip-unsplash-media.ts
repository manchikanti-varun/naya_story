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

async function main() {
  await connectDb(MONGODB_URI);

  const settings = await SiteSettings.findOne().lean();
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
    const clean = sanitizeProductMedia(p as Record<string, unknown>);
    const before = JSON.stringify(p.images);
    const after = JSON.stringify(clean.images);
    if (
      before !== after ||
      p.hoverImage !== clean.hoverImage ||
      p.newInHoverImage !== clean.newInHoverImage
    ) {
      await Product.updateOne(
        { _id: p._id },
        {
          $set: {
            images: clean.images,
            hoverImage: clean.hoverImage || undefined,
            newInHoverImage: clean.newInHoverImage || undefined,
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
