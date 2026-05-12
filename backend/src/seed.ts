import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { defaultHomepageConfig } from "./lib/homepage-defaults.js";
import { Coupon } from "./models/Coupon.js";
import { Product } from "./models/Product.js";
import { SiteSettings } from "./models/SiteSettings.js";
import { User } from "./models/User.js";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/naya-studio";

function variant(sku: string, size: string, color: string, stock: number) {
  return { sku, size, color, stock };
}

async function seed() {
  await connectDb(MONGODB_URI);

  await Promise.all([
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    User.deleteMany({}),
    SiteSettings.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("Admin123!", 10);
  await User.create({
    email: "admin@nayastudio.com",
    passwordHash,
    name: "Studio Admin",
    role: "admin",
  });

  await User.create({
    email: "client@nayastudio.com",
    passwordHash: await bcrypt.hash("Client123!", 10),
    name: "Amelia Laurent",
    role: "customer",
    addresses: [
      {
        line1: "21 Baker Street",
        city: "Mumbai",
        state: "MH",
        postalCode: "400001",
        country: "India",
      },
    ],
  });

  await Coupon.insertMany([
    {
      code: "NAYA10",
      type: "percent",
      value: 10,
      usageLimit: 1000,
      usedCount: 0,
      active: true,
    },
    {
      code: "WELCOME500",
      type: "fixed",
      value: 500,
      usageLimit: 500,
      usedCount: 0,
      active: true,
    },
  ]);

  await Product.insertMany([
    {
      name: "Aria Silk Slip Dress",
      slug: "aria-silk-slip-dress",
      description:
        "Bias-cut silk with a liquid hand — narrow straps, elongated torso, and a hem that kisses the floor.",
      price: 12900,
      compareAtPrice: 14900,
      category: "dresses",
      tags: ["new-arrivals", "summer-edit", "everyday-luxury", "bestseller"],
      featured: true,
      bestseller: true,
      fabricDetails:
        "19 momme sand-washed silk charmeuse, cupro lining at bodice, French seams.",
      stylingSuggestions: "Wear with a whisper of gold at the ear — barefoot indoors, satin flats beyond.",
      images: [
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85",
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&q=85",
      ],
      variants: [
        variant("NS-ARIA-S-IVORY", "S", "Ivory", 12),
        variant("NS-ARIA-M-IVORY", "M", "Ivory", 14),
        variant("NS-ARIA-L-IVORY", "L", "Ivory", 9),
        variant("NS-ARIA-S-SAND", "S", "Sand", 6),
        variant("NS-ARIA-M-SAND", "M", "Sand", 8),
      ],
    },
    {
      name: "Tempest Tailored Coat",
      slug: "tempest-tailored-coat",
      description:
        "Sculpted shoulders, suppressed waist — outerwear that reads like tailoring from another era.",
      price: 18900,
      category: "outerwear",
      tags: ["elevated-essentials", "new-arrivals", "bestseller"],
      featured: true,
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=1200&q=85",
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200&q=85",
      ],
      variants: [
        variant("NS-TEMP-XS-NOIR", "XS", "Noir", 4),
        variant("NS-TEMP-S-NOIR", "S", "Noir", 7),
        variant("NS-TEMP-M-NOIR", "M", "Noir", 5),
        variant("NS-TEMP-L-NOIR", "L", "Noir", 3),
      ],
    },
    {
      name: "Solstice Open Shirt",
      slug: "solstice-open-shirt",
      description:
        "Paper-light cotton poplin with an exaggerated cuff — unhurried structure for coastal mornings.",
      price: 6200,
      category: "tops",
      tags: ["summer-edit", "everyday-luxury"],
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1598550476439-684778ae0ce0?w=1200&q=85",
        "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=1200&q=85",
      ],
      variants: [
        variant("NS-SOL-XS-IVORY", "XS", "Ivory", 10),
        variant("NS-SOL-S-IVORY", "S", "Ivory", 12),
        variant("NS-SOL-M-IVORY", "M", "Ivory", 11),
        variant("NS-SOL-M-SAND", "M", "Sand", 9),
      ],
    },
    {
      name: "Nocturne Drape Set",
      slug: "nocturne-drape-set",
      description:
        "Twin pieces in matte jersey — drape held by invisible tact, movement choreographed by you.",
      price: 9800,
      category: "sets",
      tags: ["everyday-luxury", "elevated-essentials"],
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1525507119028-ed4c629a60a7?w=1200&q=85",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=85",
      ],
      variants: [
        variant("NS-NOC-S-NOIR", "S", "Noir", 8),
        variant("NS-NOC-M-NOIR", "M", "Noir", 8),
        variant("NS-NOC-L-NOIR", "L", "Noir", 6),
        variant("NS-NOC-M-ROSE", "M", "Rose", 5),
      ],
    },
    {
      name: "Pearl Knit Column Dress",
      slug: "pearl-knit-column-dress",
      description:
        "Fine gauge knit with subtle lustre — column silhouette for evenings without spectacle.",
      price: 11200,
      compareAtPrice: 12400,
      category: "dresses",
      tags: ["elevated-essentials", "new-arrivals"],
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85",
        "https://images.unsplash.com/photo-1485462537746-965f85ac41cd?w=1200&q=85",
      ],
      variants: [
        variant("NS-PRL-XS-IVORY", "XS", "Ivory", 7),
        variant("NS-PRL-S-IVORY", "S", "Ivory", 9),
        variant("NS-PRL-M-IVORY", "M", "Ivory", 10),
        variant("NS-PRL-L-IVORY", "L", "Ivory", 4),
      ],
    },
    {
      name: "Saffron Linen Set",
      slug: "saffron-linen-set",
      description:
        "Belgian linen softened through garment dye — cropped jacket and fluid trouser.",
      price: 13900,
      category: "sets",
      tags: ["summer-edit", "everyday-luxury"],
      images: [
        "https://images.unsplash.com/photo-1594938298603-c8148c400dae?w=1200&q=85",
        "https://images.unsplash.com/photo-1485968579580-b7d754ef750f?w=1200&q=85",
      ],
      variants: [
        variant("NS-SAF-S-SAND", "S", "Sand", 6),
        variant("NS-SAF-M-SAND", "M", "Sand", 8),
        variant("NS-SAF-L-SAND", "L", "Sand", 5),
      ],
    },
    {
      name: "Muse Evening Gown",
      slug: "muse-evening-gown",
      description:
        "Architectural bodice, whisper-weight skirt — designed for candlelit galleries.",
      price: 24600,
      category: "dresses",
      tags: ["new-arrivals", "elevated-essentials"],
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=85",
        "https://images.unsplash.com/photo-1518895949257-7621c3cc0862?w=1200&q=85",
      ],
      variants: [
        variant("NS-MUS-XS-NOIR", "XS", "Noir", 3),
        variant("NS-MUS-S-NOIR", "S", "Noir", 4),
        variant("NS-MUS-M-NOIR", "M", "Noir", 4),
      ],
    },
    {
      name: "Lumen Minimal Shirt",
      slug: "lumen-minimal-shirt",
      description:
        "Cold-handle cotton with concealed placket — the shirt equivalent of a held breath.",
      price: 5400,
      category: "tops",
      tags: ["everyday-luxury"],
      images: [
        "https://images.unsplash.com/photo-1577900234389-f773880ed79c?w=1200&q=85",
        "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=1200&q=85",
      ],
      variants: [
        variant("NS-LUM-XS-IVORY", "XS", "Ivory", 14),
        variant("NS-LUM-S-IVORY", "S", "Ivory", 15),
        variant("NS-LUM-M-IVORY", "M", "Ivory", 15),
        variant("NS-LUM-L-IVORY", "L", "Ivory", 12),
      ],
    },
    // --- Temporary demo products (safe to remove before production) ---
    {
      name: "Crescent Wool Cape",
      slug: "crescent-wool-cape",
      description:
        "Double-faced merino drape — one quiet motion to close the front, no hardware.",
      price: 15400,
      category: "outerwear",
      tags: ["demo", "new-arrivals", "elevated-essentials", "bestseller"],
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=1200&q=85",
        "https://images.unsplash.com/photo-1550614000-4b9519e02a9d?w=1200&q=85",
      ],
      variants: [
        variant("NS-CRE-S-IVORY", "S", "Ivory", 8),
        variant("NS-CRE-M-IVORY", "M", "Ivory", 10),
        variant("NS-CRE-L-IVORY", "L", "Ivory", 6),
      ],
    },
    {
      name: "Atelier Pleat Midi",
      slug: "atelier-pleat-midi",
      description:
        "Hand-pressed pleats that hold their line through the day — midi length, side zip.",
      price: 10800,
      compareAtPrice: 11800,
      category: "dresses",
      tags: ["demo", "new-arrivals", "everyday-luxury"],
      images: [
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&q=85",
        "https://images.unsplash.com/photo-1566171219819-422328c653f5?w=1200&q=85",
      ],
      variants: [
        variant("NS-ATM-XS-NOIR", "XS", "Noir", 5),
        variant("NS-ATM-S-NOIR", "S", "Noir", 8),
        variant("NS-ATM-M-NOIR", "M", "Noir", 8),
        variant("NS-ATM-L-NOIR", "L", "Noir", 4),
      ],
    },
    {
      name: "Studio Relaxed Blazer",
      slug: "studio-relaxed-blazer",
      description:
        "Unlined Italian wool with soft shoulders — tailored enough for dusk, relaxed enough for travel.",
      price: 14200,
      category: "outerwear",
      tags: ["demo", "elevated-essentials", "bestseller"],
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=85",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85",
      ],
      variants: [
        variant("NS-STB-XS-SAND", "XS", "Sand", 4),
        variant("NS-STB-S-SAND", "S", "Sand", 7),
        variant("NS-STB-M-SAND", "M", "Sand", 9),
        variant("NS-STB-L-SAND", "L", "Sand", 5),
      ],
    },
    {
      name: "Echo Silk Camisole",
      slug: "echo-silk-camisole",
      description:
        "Bias-cut habotai with a lowered back — invisible under tailoring, luminous on its own.",
      price: 4800,
      category: "tops",
      tags: ["demo", "summer-edit", "new-arrivals"],
      images: [
        "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=1200&q=85",
        "https://images.unsplash.com/photo-1581044777550-269a0e44c0b2?w=1200&q=85",
      ],
      variants: [
        variant("NS-ECH-XS-IVORY", "XS", "Ivory", 11),
        variant("NS-ECH-S-IVORY", "S", "Ivory", 14),
        variant("NS-ECH-M-IVORY", "M", "Ivory", 13),
        variant("NS-ECH-S-NOIR", "S", "Noir", 9),
      ],
    },
    {
      name: "Monograph Trousers",
      slug: "monograph-trousers",
      description:
        "High-rise wool twill with pressed crease — pared to a single tuck at the waist.",
      price: 8900,
      category: "tops",
      tags: ["demo", "elevated-essentials", "everyday-luxury", "bestseller"],
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=1200&q=85",
        "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=1200&q=85",
      ],
      variants: [
        variant("NS-MON-S-NOIR", "S", "Noir", 10),
        variant("NS-MON-M-NOIR", "M", "Noir", 12),
        variant("NS-MON-L-NOIR", "L", "Noir", 8),
      ],
    },
    {
      name: "Velum Layered Skirt",
      slug: "velum-layered-skirt",
      description:
        "Sheer organza over opaque crepe — movement without noise, length grazing the ankle.",
      price: 7600,
      category: "dresses",
      tags: ["demo", "new-arrivals", "summer-edit"],
      images: [
        "https://images.unsplash.com/photo-1583496661160-fb5886a13d6c?w=1200&q=85",
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=85",
      ],
      variants: [
        variant("NS-VEL-XS-IVORY", "XS", "Ivory", 6),
        variant("NS-VEL-S-IVORY", "S", "Ivory", 9),
        variant("NS-VEL-M-IVORY", "M", "Ivory", 9),
      ],
    },
    {
      name: "Ritual Cashmere Crew",
      slug: "ritual-cashmere-crew",
      description:
        "Featherweight cashmere with a dry hand — ribbed cuffs, dropped shoulder, studio palette.",
      price: 9200,
      category: "tops",
      tags: ["demo", "everyday-luxury", "bestseller"],
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=85",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=85",
      ],
      variants: [
        variant("NS-RIT-XS-SAND", "XS", "Sand", 7),
        variant("NS-RIT-S-SAND", "S", "Sand", 10),
        variant("NS-RIT-M-SAND", "M", "Sand", 10),
        variant("NS-RIT-L-SAND", "L", "Sand", 6),
      ],
    },
    {
      name: "Nadir Co-ord Short Set",
      slug: "nadir-coord-short-set",
      description:
        "Structured short and boxy jacket in the same tropical wool — for cities that stay warm past dusk.",
      price: 11800,
      category: "sets",
      tags: ["demo", "new-arrivals", "summer-edit"],
      images: [
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=85",
        "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=1200&q=85",
      ],
      variants: [
        variant("NS-NAD-S-IVORY", "S", "Ivory", 8),
        variant("NS-NAD-M-IVORY", "M", "Ivory", 8),
        variant("NS-NAD-L-IVORY", "L", "Ivory", 5),
      ],
    },
  ]);

  const productsInserted = await Product.find({}).lean();
  const hp = defaultHomepageConfig();
  hp.announcements = ["Complimentary alterations on eveningwear this month."];
  const bestIds = productsInserted
    .filter((p) => p.bestseller)
    .map((p) => String(p._id))
    .slice(0, 8);
  const newIds = productsInserted
    .filter((p) => Array.isArray(p.tags) && p.tags.includes("new-arrivals"))
    .map((p) => String(p._id))
    .slice(0, 8);
  hp.bestsellers.productIds = bestIds.length
    ? bestIds
    : productsInserted.slice(0, 8).map((p) => String(p._id));
  hp.newIn.productIds = newIds.length
    ? newIds
    : productsInserted.slice(0, 8).map((p) => String(p._id));
  await SiteSettings.create({ homepage: hp, banners: [] });

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
