/**
 * Create or reset the admin user password (does not delete products/CMS).
 * Run: ADMIN_PASSWORD=... npm run set-admin --workspace=backend
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { User } from "./models/User.js";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/naya-studio";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || "admin.nayastory@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error("[set-admin] Set ADMIN_PASSWORD in the environment.");
    process.exit(1);
  }

  await connectDb(MONGODB_URI);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    if (!existing.name?.trim()) existing.name = "Studio Admin";
    await existing.save();
    console.log(`[set-admin] Updated admin password for ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      email: ADMIN_EMAIL,
      passwordHash,
      name: "Studio Admin",
      role: "admin",
    });
    console.log(`[set-admin] Created admin ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
