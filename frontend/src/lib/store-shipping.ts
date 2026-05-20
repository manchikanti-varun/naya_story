/** Minimum cart subtotal (INR) for complimentary shipping — matches checkout */
export const FREE_SHIPPING_THRESHOLD_INR = 15_000;

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
