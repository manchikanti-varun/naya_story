import { Coupon } from "../models/Coupon.js";

export const couponRepository = {
  async findByCode(code: string) {
    return Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
  },

  async findAll() {
    return Coupon.find().sort({ createdAt: -1 }).lean();
  },

  async create(data: Record<string, unknown>) {
    return Coupon.create(data);
  },

  async updateById(id: string, data: Record<string, unknown>) {
    return Coupon.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteById(id: string) {
    return Coupon.findByIdAndDelete(id);
  },

  async incrementUsage(id: unknown) {
    return Coupon.findByIdAndUpdate(id, { $inc: { usedCount: 1 } });
  },

  async decrementUsage(code: string) {
    return Coupon.findOneAndUpdate(
      { code, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } },
    );
  },
};
