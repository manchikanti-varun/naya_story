import { Coupon } from "../models/Coupon.js";

type CouponResult = {
  discount: number;
  couponCode: string | undefined;
  coupon: InstanceType<typeof Coupon> | null;
};

/**
 * Resolve a coupon code: validate it and calculate the discount.
 * Does NOT increment usage — use `claimCoupon` for atomic claim during checkout.
 */
export async function resolveCoupon(code: string | undefined, subtotal: number): Promise<CouponResult> {
  if (!code?.trim()) {
    return { discount: 0, couponCode: undefined, coupon: null };
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    active: true,
  });
  if (!coupon) return { discount: 0, couponCode: undefined, coupon: null };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { discount: 0, couponCode: undefined, coupon: null };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { discount: 0, couponCode: undefined, coupon: null };
  }

  const discount = calculateDiscount(coupon.type, coupon.value, subtotal);
  return { discount, couponCode: coupon.code, coupon };
}

/**
 * Atomically claim a coupon — validates AND increments usedCount in a single
 * findOneAndUpdate operation. Prevents race conditions on usage-limited coupons.
 *
 * Returns the claimed coupon with calculated discount, or null result if invalid/exhausted.
 */
export async function claimCoupon(code: string | undefined, subtotal: number): Promise<CouponResult> {
  if (!code?.trim()) {
    return { discount: 0, couponCode: undefined, coupon: null };
  }

  const now = new Date();
  const normalizedCode = code.trim().toUpperCase();

  // Atomic claim: validate all conditions AND increment usedCount in one operation.
  // If usageLimit is set, only succeeds when usedCount < usageLimit.
  // This eliminates the TOCTOU race condition between read and write.
  const coupon = await Coupon.findOneAndUpdate(
    {
      code: normalizedCode,
      active: true,
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: null },
            { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
          ],
        },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true },
  );

  if (!coupon) {
    return { discount: 0, couponCode: undefined, coupon: null };
  }

  const discount = calculateDiscount(coupon.type, coupon.value, subtotal);
  return { discount, couponCode: coupon.code, coupon };
}

/**
 * Release a previously claimed coupon (compensating action on order failure).
 */
export async function releaseCouponClaim(couponId: unknown): Promise<void> {
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: -1 } });
}

function calculateDiscount(type: string, value: number, subtotal: number): number {
  if (type === "percent") return Math.round((subtotal * value) / 100);
  return Math.min(value, subtotal);
}
