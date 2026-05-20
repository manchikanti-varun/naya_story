/**
 * Remove catalog and transactional dev data. Keeps admin user(s) and legal pages.
 * Run: npm run clear-data --workspace=backend
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { mergeHomepageConfig } from "./lib/homepage-defaults.js";
import { Coupon } from "./models/Coupon.js";
import { HomepageRevision } from "./models/HomepageRevision.js";
import { MediaAsset } from "./models/MediaAsset.js";
import { Order } from "./models/Order.js";
import { ProcessedWebhook } from "./models/ProcessedWebhook.js";
import { Product } from "./models/Product.js";
import { RefreshToken } from "./models/RefreshToken.js";
import { SiteSettings } from "./models/SiteSettings.js";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/naya-studio";

async function clearData() {
  await connectDb(MONGODB_URI);

  const [products, orders, coupons] = await Promise.all([
    Product.deleteMany({}),
    Order.deleteMany({}),
    Coupon.deleteMany({}),
    RefreshToken.deleteMany({}),
    ProcessedWebhook.deleteMany({}),
    HomepageRevision.deleteMany({}),
    MediaAsset.deleteMany({}),
  ]);

  const doc = await SiteSettings.findOne();
  if (doc) {
    const hp = mergeHomepageConfig(
      (doc.homepageDraft ?? doc.homepage) as Parameters<typeof mergeHomepageConfig>[0],
    );
    hp.bestsellers.productIds = [];
    hp.newIn.productIds = [];
    await SiteSettings.updateOne(
      { _id: doc._id },
      {
        $set: {
          homepage: hp,
          homepageDraft: hp,
          banners: [],
        },
      },
    );
  }

  console.log("Cleared dev data:");
  console.log(`  products: ${products.deletedCount}`);
  console.log(`  orders: ${orders.deletedCount}`);
  console.log(`  coupons: ${coupons.deletedCount}`);
  console.log("  CMS product rails emptied (bestsellers / new-in).");
  console.log("Admin users and legal pages were not removed.");
  await mongoose.disconnect();
}

clearData().catch((e) => {
  console.error(e);
  process.exit(1);
});
