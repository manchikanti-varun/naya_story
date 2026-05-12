import type { Types } from "mongoose";

export type LeanProduct = {
  _id: Types.ObjectId;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  category: string;
  images: string[];
  variants: { sku: string; size: string; color: string; stock: number }[];
};

export type LeanOrder = {
  _id: Types.ObjectId;
  user?: Types.ObjectId | string | null;
  status?: string;
};

export type LeanUserFull = {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: string;
  wishlist?: Types.ObjectId[];
  addresses?: unknown[];
};
