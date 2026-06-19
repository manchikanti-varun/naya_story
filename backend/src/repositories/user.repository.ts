import mongoose from "mongoose";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";

export type CreateUserData = {
  email: string;
  passwordHash?: string;
  name: string;
  phone?: string;
  googleId?: string;
  firebaseUid?: string;
  role: "customer" | "admin";
};

export type UserProjection = {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  role: string;
  passwordHash?: string;
  googleId?: string;
  wishlist?: mongoose.Types.ObjectId[];
  addresses?: unknown[];
};

export const userRepository = {
  async findByEmail(email: string) {
    return User.findOne({ email });
  },

  async findById(id: string) {
    return User.findById(id);
  },

  async findByIdLean(id: string): Promise<UserProjection | null> {
    const raw = await User.findById(id).lean();
    if (!raw || Array.isArray(raw)) return null;
    return raw as unknown as UserProjection;
  },

  async findByGoogleId(googleId: string) {
    return User.findOne({ googleId });
  },

  async findByPhone(phone: string) {
    return User.findOne({ phone });
  },

  async findByFirebaseUid(uid: string) {
    return User.findOne({ firebaseUid: uid });
  },

  async create(data: CreateUserData) {
    return User.create(data);
  },

  async findCustomers(limit = 500) {
    return User.find({ role: "customer" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name email createdAt")
      .lean();
  },

  async countCustomers() {
    return User.countDocuments({ role: "customer" });
  },

  async updateAddresses(userId: string, addresses: unknown[]) {
    return User.findByIdAndUpdate(userId, { addresses });
  },

  async updateWishlist(userId: string, wishlist: mongoose.Types.ObjectId[]) {
    return User.findByIdAndUpdate(userId, { wishlist }, { new: true });
  },

  async findWithWishlist(userId: string) {
    return User.findById(userId).populate("wishlist").lean();
  },

  // Refresh tokens
  async deleteAllRefreshTokens(userId: mongoose.Types.ObjectId) {
    return RefreshToken.deleteMany({ userId });
  },

  async createRefreshToken(userId: mongoose.Types.ObjectId, tokenHash: string, expiresAt: Date) {
    return RefreshToken.create({ userId, tokenHash, expiresAt });
  },

  async findValidRefreshToken(tokenHash: string) {
    return RefreshToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
  },

  async deleteRefreshToken(id: mongoose.Types.ObjectId) {
    return RefreshToken.deleteOne({ _id: id });
  },

  async deleteRefreshTokensByHash(tokenHash: string) {
    return RefreshToken.deleteMany({ tokenHash });
  },
};
