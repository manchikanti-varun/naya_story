/**
 * Coupon service — handles coupon validation and CRUD.
 */
import { couponRepository } from "../repositories/coupon.repository.js";
import { resolveCoupon } from "../lib/coupon-utils.js";
import { HttpError } from "../middleware/httpError.js";

export const couponService = {
  async validate(code: string, subtotal: number) {
    const { discount, couponCode } = await resolveCoupon(code, Number(subtotal));
    if (!couponCode) return { valid: false, discount: 0, code: null };
    return { valid: true, discount, code: couponCode };
  },

  async listAll() {
    return couponRepository.findAll();
  },

  async create(data: { code: string; type: string; value: number; [key: string]: unknown }) {
    return couponRepository.create({
      ...data,
      code: String(data.code).toUpperCase(),
    });
  },

  async update(id: string, rawBody: Record<string, unknown>) {
    const allowedFields = ["code", "type", "value", "expiresAt", "usageLimit", "active"];
    const sanitized: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in rawBody) sanitized[key] = rawBody[key];
    }
    if (sanitized.code) sanitized.code = String(sanitized.code).toUpperCase();

    const doc = await couponRepository.updateById(id, sanitized);
    if (!doc) throw new HttpError(404, "Not found");
    return doc;
  },

  async delete(id: string) {
    await couponRepository.deleteById(id);
  },
};
