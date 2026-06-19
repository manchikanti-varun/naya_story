import mongoose from "mongoose";
import { Order } from "../models/Order.js";

export type CreateOrderData = {
  orderNumber: string;
  idempotencyKey?: string;
  user?: string;
  guestEmail?: string;
  items: unknown[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
  shippingAddress: unknown;
  timeline: { status: string; at: Date }[];
  paymentProvider: string;
  paymentReference?: string;
  razorpayPaymentId?: string;
  status: string;
};

export const orderRepository = {
  async create(data: CreateOrderData) {
    return Order.create(data);
  },

  async findById(id: string) {
    return Order.findById(id);
  },

  async findByIdLean(id: string) {
    const raw = await Order.findById(id).lean();
    if (!raw || Array.isArray(raw)) return null;
    return raw;
  },

  async findByIdempotencyKey(key: string) {
    return Order.findOne({ idempotencyKey: key }).lean();
  },

  async findByUser(userId: string) {
    return Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  },

  async findByUserPaginated(userId: string, skip: number, limit: number) {
    const filter = { user: userId };
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    return { orders, total };
  },

  async findAll(limit = 200) {
    return Order.find().sort({ createdAt: -1 }).limit(limit).lean();
  },

  async findFilteredPaginated(filter: Record<string, unknown>, skip: number, limit: number) {
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "name email phone").lean(),
      Order.countDocuments(filter),
    ]);
    return { orders, total };
  },

  async findByRazorpayPaymentId(paymentId: string) {
    return Order.findOne({ razorpayPaymentId: paymentId });
  },

  async countAll() {
    return Order.countDocuments();
  },

  async countByStatuses(statuses: string[]) {
    return Order.countDocuments({ status: { $in: statuses } });
  },

  async findRecent(limit = 8) {
    return Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("orderNumber status total createdAt guestEmail")
      .lean();
  },

  async aggregateRevenue() {
    const [result] = await Order.aggregate<{ _id: null; revenue: number }>([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]);
    return result?.revenue ?? 0;
  },

  async aggregateTopProducts(limit = 5) {
    return Order.aggregate<{
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
      { $limit: limit },
    ]);
  },

  async aggregateSalesTrend(since: Date) {
    return Order.aggregate<{ _id: string; revenue: number }>([
      { $match: { createdAt: { $gte: since }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  async aggregateByUser(userIds: mongoose.Types.ObjectId[]) {
    return Order.aggregate<{
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
    ]);
  },

  async aggregateByGuestEmail() {
    return Order.aggregate<{
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
    ]);
  },
};
