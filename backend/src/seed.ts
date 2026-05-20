import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { defaultHomepageConfig } from "./lib/homepage-defaults.js";
import { Coupon } from "./models/Coupon.js";
import { HomepageRevision } from "./models/HomepageRevision.js";
import { MediaAsset } from "./models/MediaAsset.js";
import { Order } from "./models/Order.js";
import { ProcessedWebhook } from "./models/ProcessedWebhook.js";
import { Product } from "./models/Product.js";
import { RefreshToken } from "./models/RefreshToken.js";
import { SiteSettings } from "./models/SiteSettings.js";
import { User } from "./models/User.js";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/naya-studio";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || "admin.nayastory@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();

async function seed() {
  if (!ADMIN_PASSWORD) {
    console.error(
      "[seed] Set ADMIN_PASSWORD in the environment before running (see backend/.env.example).",
    );
    process.exit(1);
  }

  await connectDb(MONGODB_URI);

  await Promise.all([
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    User.deleteMany({}),
    SiteSettings.deleteMany({}),
    Order.deleteMany({}),
    RefreshToken.deleteMany({}),
    ProcessedWebhook.deleteMany({}),
    HomepageRevision.deleteMany({}),
    MediaAsset.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({
    email: ADMIN_EMAIL,
    passwordHash,
    name: "Studio Admin",
    role: "admin",
  });

  const hp = defaultHomepageConfig();
  hp.bestsellers.productIds = [];
  hp.newIn.productIds = [];
  await SiteSettings.create({ homepage: hp, banners: [] });

  console.log("Seed complete — admin account and empty CMS only.");
  console.log(`Admin email: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
