import mongoose from "mongoose";
import { Product } from "../models/Product.js";

export type ProductFilter = Record<string, unknown>;
export type ProductSort = Record<string, 1 | -1>;

export const productRepository = {
  async findById(id: string) {
    return Product.findById(id);
  },

  async findByIdLean(id: string) {
    const raw = await Product.findById(id).lean();
    if (!raw || Array.isArray(raw)) return null;
    return raw;
  },

  async findBySlugLean(slug: string) {
    const raw = await Product.findOne({ slug }).lean();
    if (!raw || Array.isArray(raw)) return null;
    return raw;
  },

  async findByIds(ids: mongoose.Types.ObjectId[], filter?: ProductFilter) {
    return Product.find({ _id: { $in: ids }, ...filter }).lean();
  },

  async findPaginated(
    filter: ProductFilter,
    sort: ProductSort,
    skip: number,
    limit: number,
  ) {
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    return { products, total };
  },

  async create(data: Record<string, unknown>) {
    return Product.create(data);
  },

  async updateById(id: string, data: Record<string, unknown>) {
    return Product.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteById(id: string) {
    return Product.findByIdAndDelete(id);
  },

  async findLowStock(threshold = 5, limit = 10) {
    return Product.find({
      variants: { $elemMatch: { stock: { $lte: threshold, $gte: 1 } } },
    })
      .limit(limit)
      .select("name slug variants")
      .lean();
  },

  async countOutOfStock() {
    return Product.countDocuments({
      variants: { $not: { $elemMatch: { stock: { $gt: 0 } } } },
    });
  },

  async distinctCategories() {
    return Product.distinct("category") as Promise<string[]>;
  },

  async findByFlags(flags: { newIn?: boolean; bestseller?: boolean }) {
    const filter: Record<string, unknown> = {};
    if (flags.newIn) filter.newIn = true;
    if (flags.bestseller) filter.bestseller = true;
    return Product.find(filter).select("_id").lean();
  },
};
