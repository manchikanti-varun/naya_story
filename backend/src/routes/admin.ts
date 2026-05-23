import type { RequestHandler } from "express";
import { Router } from "express";
import mongoose from "mongoose";
import { mergeHomepageConfig } from "../lib/homepage-defaults.js";
import { loadPdpSuggestedProducts } from "../lib/pdp-suggestions.js";
import { mergeStorefrontSettings } from "../lib/storefront-settings.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { SiteSettings } from "../models/SiteSettings.js";
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
      .select("orderNumber status total createdAt guestEmail")
      .lean();

    const pendingOrdersCount = await Order.countDocuments({
      status: { $in: ["pending", "confirmed", "packed"] },
    });

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
      pendingOrdersCount,
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
      .limit(500)
      .select("name email createdAt")
      .lean();

    const userIds = customers.map((c) => c._id);

    const [byUser, byGuestEmail] = await Promise.all([
      Order.aggregate<{
        _id: mongoose.Types.ObjectId;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date;
      }>([
        { $match: { user: { $in: userIds }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$user",
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$total" },
            lastOrderAt: { $max: "$createdAt" },
          },
        },
      ]),
      Order.aggregate<{
        _id: string;
        orderCount: number;
        totalSpent: number;
        lastOrderAt: Date;
      }>([
        {
          $match: {
            guestEmail: { $exists: true, $nin: [null, ""] },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: { $toLower: "$guestEmail" },
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$total" },
            lastOrderAt: { $max: "$createdAt" },
          },
        },
      ]),
    ]);

    const userMap = new Map(byUser.map((s) => [String(s._id), s]));
    const emailMap = new Map(byGuestEmail.map((s) => [s._id, s]));
    const registeredEmails = new Set(customers.map((c) => c.email.toLowerCase()));

    const enriched = customers.map((c) => {
      const u = userMap.get(String(c._id));
      const e = emailMap.get(c.email.toLowerCase());
      const orderCount = (u?.orderCount ?? 0) + (e?.orderCount ?? 0);
      const totalSpent = (u?.totalSpent ?? 0) + (e?.totalSpent ?? 0);
      const lastOrderAt = [u?.lastOrderAt, e?.lastOrderAt]
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
      return {
        ...c,
        orderCount,
        totalSpent,
        lastOrderAt: lastOrderAt ?? null,
      };
    });

    const guestBuyers = byGuestEmail
      .filter((g) => !registeredEmails.has(g._id))
      .map((g) => ({
        email: g._id,
        orderCount: g.orderCount,
        totalSpent: g.totalSpent,
        lastOrderAt: g.lastOrderAt,
      }))
      .sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime())
      .slice(0, 100);

    const withOrders = enriched.filter((c) => c.orderCount > 0).length;

    res.json({
      customers: enriched,
      guestBuyers,
      summary: {
        registered: customers.length,
        withOrders,
        guestOnly: guestBuyers.length,
      },
    });
  });

  /** Full product + suggested rail for admin storefront preview (includes hidden). */
  r.get("/products/slug/:slug", async (req, res) => {
    const raw = await Product.findOne({ slug: req.params.slug }).lean();
    if (!raw) return res.status(404).json({ message: "Not found" });
    const product = raw;
    const settingsDoc = (await SiteSettings.findOne().lean()) as { storefront?: unknown; homepage?: unknown } | null;
    const homepage = mergeHomepageConfig(
      (settingsDoc?.homepage ?? {}) as Parameters<typeof mergeHomepageConfig>[0],
    );
    const storefront = mergeStorefrontSettings(settingsDoc?.storefront);
    const suggested = await loadPdpSuggestedProducts(
      product as unknown as { _id: mongoose.Types.ObjectId; category: string; collection?: string },
      storefront.pdpSuggestedMode ?? "auto",
      homepage,
    );
    res.json({
      product,
      related: suggested.products,
      suggested: {
        mode: suggested.mode,
        label: suggested.label,
        products: suggested.products,
      },
      storefront,
    });
  });

  return r;
}
