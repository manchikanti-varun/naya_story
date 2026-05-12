import type { RequestHandler } from "express";
import { Router } from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { requireAdmin } from "../middleware/auth.js";

export function createAdminRouter(secret: string) {
  const r = Router();

  r.use(...(requireAdmin(secret) as RequestHandler[]));

  r.get("/overview", async (_req, res) => {
    const [revenueAgg] = await Order.aggregate<{ _id: null; revenue: number }>([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]);

    const ordersCount = await Order.countDocuments();
    const customersCount = await User.countDocuments({ role: "customer" });

    const topProducts = await Order.aggregate<{
      _id: mongoose.Types.ObjectId;
      units: number;
      revenue: number;
    }>([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          units: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const lowStock = await Product.find({
      variants: { $elemMatch: { stock: { $lte: 5, $gte: 1 } } },
    })
      .limit(10)
      .select("name slug variants")
      .lean();

    const outOfStock = await Product.countDocuments({
      variants: { $not: { $elemMatch: { stock: { $gt: 0 } } } },
    });

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select("orderNumber status total createdAt")
      .lean();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesTrend = await Order.aggregate<{ _id: string; revenue: number }>([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      revenue: revenueAgg?.revenue ?? 0,
      ordersCount,
      customersCount,
      topProducts,
      lowStock,
      outOfStockCount: outOfStock,
      recentOrders,
      salesTrend,
    });
  });

  r.get("/customers", async (_req, res) => {
    const customers = await User.find({ role: "customer" })
      .sort({ createdAt: -1 })
      .limit(200)
      .select("name email createdAt")
      .lean();
    res.json({ customers });
  });

  /** Full product + related for admin storefront preview (includes hidden). */
  r.get("/products/slug/:slug", async (req, res) => {
    const raw = await Product.findOne({ slug: req.params.slug }).lean();
    if (!raw) return res.status(404).json({ message: "Not found" });
    const product = raw;
    const related = await Product.find({
      category: (product as { category?: string }).category,
      _id: { $ne: (product as { _id: mongoose.Types.ObjectId })._id },
      storefrontVisible: { $ne: false },
    })
      .limit(4)
      .lean();
    res.json({ product, related });
  });

  return r;
}
