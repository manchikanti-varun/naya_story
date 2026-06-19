/**
 * Customer service — handles wishlist and addresses for authenticated users.
 */
import mongoose from "mongoose";
import { userRepository } from "../repositories/user.repository.js";
import { HttpError } from "../middleware/httpError.js";
import { MAX_WISHLIST_ITEMS } from "../models/User.js";

export const customerService = {
  async getWishlist(userId: string) {
    const raw = await userRepository.findWithWishlist(userId);
    if (!raw || Array.isArray(raw)) throw new HttpError(404, "Not found");
    const user = raw as { wishlist?: unknown[] };
    return user.wishlist ?? [];
  },

  async toggleWishlistItem(userId: string, productId: string) {
    if (!mongoose.isValidObjectId(productId)) {
      throw new HttpError(400, "Invalid product");
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new HttpError(404, "Not found");

    const list = new Set((user.wishlist ?? []).map(String));
    if (list.has(productId)) {
      list.delete(productId);
    } else {
      if (list.size >= MAX_WISHLIST_ITEMS) {
        throw new HttpError(422, `Wishlist is full (max ${MAX_WISHLIST_ITEMS} items). Remove an item first.`);
      }
      list.add(productId);
    }

    user.wishlist = [...list].map(
      (id) => new mongoose.Types.ObjectId(String(id)),
    ) as mongoose.Types.ObjectId[];
    await user.save();

    return user.wishlist.map(String);
  },

  async updateAddresses(userId: string, addresses: Record<string, unknown>[]) {
    const sanitized = addresses.map((addr) => ({
      line1: String(addr.line1 ?? "").trim(),
      line2: addr.line2 ? String(addr.line2).trim() : undefined,
      city: String(addr.city ?? "").trim(),
      state: String(addr.state ?? "").trim(),
      postalCode: String(addr.postalCode ?? "").trim(),
      country: String(addr.country ?? "").trim(),
    }));

    await userRepository.updateAddresses(userId, sanitized);
    const fresh = await userRepository.findByIdLean(userId);
    return fresh?.addresses ?? [];
  },

  /**
   * Get the user's server-side cart (for cross-device sync).
   */
  async getCart(userId: string) {
    const user = await userRepository.findByIdLean(userId);
    if (!user) throw new HttpError(404, "Not found");
    const cart = (user as { cart?: { lines?: unknown[]; coupon?: string; updatedAt?: string } }).cart;
    return {
      lines: cart?.lines ?? [],
      coupon: cart?.coupon ?? undefined,
      updatedAt: cart?.updatedAt ?? null,
    };
  },

  /**
   * Save/overwrite the user's cart (synced from client after login).
   */
  async saveCart(userId: string, lines: unknown[], coupon?: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new HttpError(404, "Not found");

    (user as unknown as { cart: unknown }).cart = {
      lines: (lines ?? []).slice(0, 50),
      coupon: coupon?.trim() || "",
      updatedAt: new Date(),
    };
    await user.save();

    return { lines: (lines ?? []).slice(0, 50), coupon: coupon?.trim() || "" };
  },
};
