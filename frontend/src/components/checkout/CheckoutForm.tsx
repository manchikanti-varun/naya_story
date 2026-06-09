"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { lineKey, useCart } from "@/context/cart-context";
import { useCouponDiscount } from "@/hooks/use-coupon-discount";
import { FREE_SHIPPING_THRESHOLD_INR } from "@/lib/store-shipping";

type PaymentPreview = {
  provider: string;
  clientSecret?: string;
  message?: string;
};

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, coupon, clear } = useCart();
  const { token, user, addresses } = useAuth();

  const [shipping, setShipping] = useState({
    line1: addresses[0]?.line1 ?? "",
    line2: addresses[0]?.line2 ?? "",
    city: addresses[0]?.city ?? "",
    state: addresses[0]?.state ?? "",
    postalCode: addresses[0]?.postalCode ?? "",
    country: addresses[0]?.country ?? "India",
  });

  const [guestEmail, setGuestEmail] = useState(user?.email ?? "");
  const [payPreview, setPayPreview] = useState<PaymentPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD_INR ? 0 : 299;
  const { discount } = useCouponDiscount(coupon, subtotal);

  const total = Math.max(0, subtotal + shippingFee - discount);

  async function preparePayment() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/integrations/shipping/estimate", {
        method: "POST",
        body: JSON.stringify({ postalCode: shipping.postalCode, subtotal }),
      });

      const intent = await apiFetch<PaymentPreview>("/integrations/payments/create-intent", {
        method: "POST",
        body: JSON.stringify({ amount: total, currency: "inr", provider: "stripe" }),
      });
      setPayPreview(intent);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function placeOrder() {
    setLoading(true);
    setError(null);
    try {
      const items = lines.map((l) => ({
        productId: l.productId,
        sku: l.sku,
        quantity: l.quantity,
      }));

      await apiFetch("/orders", {
        method: "POST",
        token,
        body: JSON.stringify({
          items,
          shippingAddress: shipping,
          couponCode: coupon,
          guestEmail: user ? undefined : guestEmail,
        }),
      });

      clear();
      router.push(user ? "/account/orders" : "/login?registered=guest");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

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
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Checkout</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Quiet completion</h1>
        <p className="mt-4 max-w-lg font-sans text-sm leading-relaxed text-ink-muted">
          Distraction-free — address, payment preview, and confirmation. Integrations for Stripe,
          Razorpay, and Shiprocket are wired on the API with demo fallbacks.
        </p>

        {!user ? (
          <div className="mt-10 rounded-[28px] border border-ivory-deep bg-white/70 p-6 backdrop-blur">
            <label className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-soft">
              Guest email
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-10 space-y-5 rounded-[28px] border border-ivory-deep bg-white/70 p-6 backdrop-blur">
          {(["line1", "line2", "city", "state", "postalCode", "country"] as const).map((field) => (
            <label key={field} className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              {field === "line1"
                ? "Address line 1"
                : field === "line2"
                  ? "Address line 2"
                  : field}
              <input
                value={shipping[field] as string}
                onChange={(e) => setShipping((s) => ({ ...s, [field]: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
              />
            </label>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
            onClick={() => void preparePayment()}
            className="rounded-full bg-ink px-10 py-4 font-sans text-[11px] uppercase tracking-[0.28em] text-ivory hover:bg-gold disabled:opacity-50"
          >
            Preview payment
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
            onClick={() => void placeOrder()}
            className="rounded-full border border-gold px-10 py-4 font-sans text-[11px] uppercase tracking-[0.28em] text-gold hover:bg-gold hover:text-white disabled:opacity-50"
          >
            Place order
          </motion.button>
        </div>

        {payPreview ? (
          <div className="mt-8 rounded-[24px] border border-gold/40 bg-ivory-muted/60 p-6 font-sans text-sm text-ink-muted">
            <p className="font-display text-xl text-ink">
              {payPreview.provider === "stripe" ? "Stripe" : "Payment"} preview
            </p>
            <p className="mt-2">
              Client secret:{" "}
              <span className="text-ink">{payPreview.clientSecret ?? "—"}</span>
            </p>
            {payPreview.message ? <p className="mt-3 text-gold">{payPreview.message}</p> : null}
          </div>
        ) : null}

        {error ? <p className="mt-6 font-sans text-sm text-red-700">{error}</p> : null}
      </div>

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
          {discount > 0 ? (
            <div className="flex justify-between text-gold">
              <dt>Discount</dt>
              <dd>-₹{discount.toLocaleString("en-IN")}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-ivory-deep pt-4 font-display text-xl text-ink">
            <dt>Total</dt>
            <dd>₹{total.toLocaleString("en-IN")}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
