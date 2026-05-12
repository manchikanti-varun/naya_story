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
    body("addresses").isArray(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      await User.findByIdAndUpdate(req.user!._id, {
        addresses: req.body.addresses,
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
