"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { z } from "zod";
import { Lock, RotateCcw, Truck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { lineKey, useCartData } from "@/context/cart-context";
import { useCouponDiscount } from "@/hooks/use-coupon-discount";
import { FREE_SHIPPING_THRESHOLD_INR } from "@/lib/store-shipping";

// --- Zod validation schema ---
const addressSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email"),
  addressLine1: z.string().min(5, "Enter your street address"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Select your state"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
});

type AddressForm = z.infer<typeof addressSchema>;
type FieldErrors = Partial<Record<keyof AddressForm, string>>;

type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderNumber: string;
  internalOrderId: string;
};

type VerifyResponse = {
  success: boolean;
  orderNumber: string;
  orderId: string;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load payment gateway"));
    document.body.appendChild(script);
  });
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, coupon, clear } = useCartData();
  const { token, user, addresses } = useAuth();

  const [form, setForm] = useState<AddressForm>({
    fullName: user?.name ?? "",
    phone: "",
    email: user?.email ?? "",
    addressLine1: addresses[0]?.line1 ?? "",
    addressLine2: addresses[0]?.line2 ?? "",
    city: addresses[0]?.city ?? "",
    state: addresses[0]?.state ?? "",
    pincode: addresses[0]?.postalCode ?? "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD_INR ? 0 : 299;
  const { discount } = useCouponDiscount(coupon, subtotal);
  const total = Math.max(0, subtotal + shippingFee - discount);

  const updateField = useCallback((field: keyof AddressForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handlePlaceOrder = async () => {
    setError(null);
    setFieldErrors({});

    // 1. Validate form fields
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AddressForm;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // 2. Create Razorpay order via backend
      const items = lines.map((l) => ({
        productId: l.productId,
        sku: l.sku,
        quantity: l.quantity,
      }));

      const orderData = await apiFetch<CreateOrderResponse>("/payment/create-order", {
        method: "POST",
        token,
        body: JSON.stringify({
          items,
          shippingAddress: form,
          couponCode: coupon,
          guestEmail: user ? undefined : form.email,
          customerName: form.fullName,
          customerPhone: form.phone,
        }),
      });

      // 3. Load Razorpay Checkout.js
      await loadRazorpayScript();

      // 4. Open Razorpay checkout modal
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "Naya Story",
        description: "Luxury Western Wear",
        image: "/logo.png",
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#C9A84C" },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // 5. Verify payment signature
            const verify = await apiFetch<VerifyResponse>("/payment/verify", {
              method: "POST",
              token,
              body: JSON.stringify(response),
            });

            // 6. Clear cart and redirect
            clear();
            router.push(`/order-confirmed/${verify.orderNumber}`);
          } catch (err) {
            setError((err as Error).message || "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
      });

      rzp.on("payment.failed", (failResponse: unknown) => {
        const failData = failResponse as { error?: { description?: string } };
        setError(failData?.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center">
        <p className="font-display text-3xl text-ink">Your bag is empty.</p>
        <Link
          href="/collections"
          className="mt-8 inline-flex rounded-full border border-gold px-10 py-3 font-sans text-[11px] uppercase tracking-[0.26em] text-gold hover:bg-gold hover:text-white"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 md:gap-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:px-10 md:py-24">
      {/* Left — Form */}
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Checkout</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Complete your order</h1>

        {/* Address form */}
        <div className="mt-10 space-y-5 rounded-[28px] border border-ivory-deep bg-white/70 p-6 backdrop-blur">
          {/* Full Name */}
          <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Full Name
            <input
              aria-required="true"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="Enter your full name"
            />
            {fieldErrors.fullName && (
              <span className="mt-1 block text-xs text-red-600" role="alert">{fieldErrors.fullName}</span>
            )}
          </label>

          {/* Phone */}
          <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Mobile Number
            <input
              aria-required="true"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {fieldErrors.phone && (
              <span className="mt-1 block text-xs text-red-600" role="alert">{fieldErrors.phone}</span>
            )}
          </label>

          {/* Email */}
          <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Email
            <input
              aria-required="true"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="your@email.com"
            />
            {fieldErrors.email && (
              <span className="mt-1 block text-xs text-red-600" role="alert">{fieldErrors.email}</span>
            )}
          </label>

          {/* Address Line 1 */}
          <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Address Line 1
            <input
              aria-required="true"
              value={form.addressLine1}
              onChange={(e) => updateField("addressLine1", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="House / flat no., street, area"
            />
            {fieldErrors.addressLine1 && (
              <span className="mt-1 block text-xs text-red-600" role="alert">{fieldErrors.addressLine1}</span>
            )}
          </label>

          {/* Address Line 2 */}
          <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Address Line 2 (optional)
            <input
              value={form.addressLine2 ?? ""}
              onChange={(e) => updateField("addressLine2", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="Landmark, apartment name"
            />
          </label>

          {/* City */}
          <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            City
            <input
              aria-required="true"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="City"
            />
            {fieldErrors.city && (
              <span className="mt-1 block text-xs text-red-600" role="alert">{fieldErrors.city}</span>
            )}
          </label>

          {/* State */}
          <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            State
            <select
              aria-required="true"
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40 bg-white"
            >
              <option value="">Select your state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {fieldErrors.state && (
              <span className="mt-1 block text-xs text-red-600" role="alert">{fieldErrors.state}</span>
            )}
          </label>

          {/* Pincode */}
          <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            Pincode
            <input
              aria-required="true"
              value={form.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              placeholder="6-digit pincode"
              maxLength={6}
            />
            {fieldErrors.pincode && (
              <span className="mt-1 block text-xs text-red-600" role="alert">{fieldErrors.pincode}</span>
            )}
          </label>
        </div>

        {/* Trust row */}
        <div className="mt-6 flex items-center gap-5 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            256-bit SSL
          </span>
          <span className="flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Easy returns
          </span>
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Free shipping over ₹15,000
          </span>
        </div>

        {/* Place Order button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={loading}
          onClick={() => void handlePlaceOrder()}
          className="mt-8 w-full rounded-full bg-ink px-10 py-4 font-sans text-[11px] uppercase tracking-[0.28em] text-ivory hover:bg-gold disabled:opacity-50 md:w-auto"
        >
          {loading ? "Processing…" : "Place Order"}
        </motion.button>

        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Right — Order summary */}
      <aside className="rounded-[32px] border border-ivory-deep bg-white/80 p-8 shadow-sm backdrop-blur">
        <h2 className="font-display text-2xl text-ink">Summary</h2>
        <ul className="mt-8 space-y-6 border-b border-ivory-deep pb-8">
          {lines.map((l) => (
            <li key={lineKey(l)} className="flex justify-between gap-4 font-sans text-sm">
              <span className="text-ink-muted">
                {l.name}{" "}
                <span className="text-ink-soft">
                  ×{l.quantity} · {l.size}/{l.color}
                </span>
              </span>
              <span className="text-ink">
                ₹{(l.price * l.quantity).toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-8 space-y-3 font-sans text-sm text-ink-muted">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="text-ink">₹{subtotal.toLocaleString("en-IN")}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="text-ink">
              {shippingFee === 0 ? "Complimentary" : `₹${shippingFee}`}
            </dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-gold">
              <dt>Discount</dt>
              <dd>-₹{discount.toLocaleString("en-IN")}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-ivory-deep pt-4 font-display text-xl text-ink">
            <dt>Total</dt>
            <dd>₹{total.toLocaleString("en-IN")}</dd>
          </div>
        </dl>

        {/* Payment methods info */}
        <div className="mt-8 border-t border-ivory-deep pt-6">
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink-soft">Accepted payments</p>
          <p className="mt-2 font-sans text-xs text-ink-muted leading-relaxed">
            UPI (GPay, PhonePe, Paytm) · All debit &amp; credit cards (Visa, Mastercard, RuPay, Amex) · Net banking · Wallets · No-cost EMI
          </p>
        </div>
      </aside>
    </div>
  );
}
