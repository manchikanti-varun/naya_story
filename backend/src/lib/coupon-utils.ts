import { Coupon } from "../models/Coupon.js";

export async function resolveCoupon(code: string | undefined, subtotal: number) {
  if (!code?.trim()) {
    return {
      discount: 0,
      couponCode: undefined as string | undefined,
      coupon: null as InstanceType<typeof Coupon> | null,
    };
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

  let discount = 0;
  if (coupon.type === "percent") discount = Math.round((subtotal * coupon.value) / 100);
  else discount = Math.min(coupon.value, subtotal);

  return { discount, couponCode: coupon.code, coupon };
}
