import { Router } from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import type { LeanProduct, LeanUserFull } from "../lean.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

export function createUsersRouter(secret: string) {
  const r = Router();

  r.get("/wishlist", requireAuth(secret), async (req, res) => {
    const raw = await User.findById(req.user!._id).populate("wishlist").lean();
    if (!raw || Array.isArray(raw))
      return res.status(404).json({ message: "Not found" });
    const user = raw as unknown as LeanUserFull & { wishlist?: LeanProduct[] };
    const products = user.wishlist ?? [];
    res.json({ products });
  });

  r.patch(
    "/wishlist",
    requireAuth(secret),
    body("productId").notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      const { productId } = req.body as { productId: string };
      if (!mongoose.isValidObjectId(productId))
        return res.status(400).json({ message: "Invalid product" });

      const user = await User.findById(req.user!._id);
      if (!user) return res.status(404).json({ message: "Not found" });

      const list = new Set((user.wishlist ?? []).map(String));
      if (list.has(productId)) list.delete(productId);
      else list.add(productId);
      user.wishlist = [...list].map(
        (id) => new mongoose.Types.ObjectId(String(id)),
      ) as mongoose.Types.ObjectId[];
      await user.save();

      res.json({ wishlist: user.wishlist.map(String) });
    },
  );

  r.put(
    "/addresses",
    requireAuth(secret),
    body("addresses").isArray({ max: 10 }),
    body("addresses.*.line1").trim().notEmpty().isLength({ max: 200 }),
    body("addresses.*.line2").optional({ values: "falsy" }).trim().isLength({ max: 200 }),
    body("addresses.*.city").trim().notEmpty().isLength({ max: 100 }),
    body("addresses.*.state").trim().notEmpty().isLength({ max: 100 }),
    body("addresses.*.postalCode").trim().notEmpty().isLength({ max: 20 }),
    body("addresses.*.country").trim().notEmpty().isLength({ max: 100 }),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      // Only allow whitelisted address fields
      const sanitizedAddresses = (req.body.addresses as Record<string, unknown>[]).map((addr) => ({
        line1: String(addr.line1 ?? "").trim(),
        line2: addr.line2 ? String(addr.line2).trim() : undefined,
        city: String(addr.city ?? "").trim(),
        state: String(addr.state ?? "").trim(),
        postalCode: String(addr.postalCode ?? "").trim(),
        country: String(addr.country ?? "").trim(),
      }));
      await User.findByIdAndUpdate(req.user!._id, {
        addresses: sanitizedAddresses,
      });
      const rawFresh = await User.findById(req.user!._id).lean();
      const fresh =
        rawFresh && !Array.isArray(rawFresh)
          ? (rawFresh as unknown as LeanUserFull)
          : null;
      res.json({ addresses: fresh?.addresses ?? [] });
    },
  );

  return r;
}
