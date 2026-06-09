import mongoose from "mongoose";
import { Review } from "../models/Review.js";

export const reviewRepository = {
  async create(data: { product: string; user: string; rating: number; body: string }) {
    return Review.create(data);
  },

  async findByProduct(productId: string, status: string = "approved", skip = 0, limit = 20) {
    const filter: Record<string, unknown> = {
      product: new mongoose.Types.ObjectId(productId),
      status,
    };
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      Review.countDocuments(filter),
    ]);
    return { reviews, total };
  },

  async findByProductAllStatuses(productId: string, skip = 0, limit = 50) {
    const filter = { product: new mongoose.Types.ObjectId(productId) };
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      Review.countDocuments(filter),
    ]);
    return { reviews, total };
  },

  async findAllPaginated(status: string | undefined, skip = 0, limit = 50) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .populate("product", "name slug images")
        .lean(),
      Review.countDocuments(filter),
    ]);
    return { reviews, total };
  },

  async findByUserAndProduct(userId: string, productId: string) {
    return Review.findOne({
      user: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(productId),
    }).lean();
  },

  async updateStatus(reviewId: string, status: "pending" | "approved" | "rejected") {
    return Review.findByIdAndUpdate(reviewId, { status }, { new: true })
      .populate("user", "name email")
      .populate("product", "name slug")
      .lean();
  },

  async deleteById(reviewId: string) {
    return Review.findByIdAndDelete(reviewId);
  },

  async getAggregateRating(productId: string) {
    const result = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: "approved" } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (!result.length) return { average: 0, count: 0 };
    return { average: Math.round(result[0].avg * 10) / 10, count: result[0].count };
  },
};
