"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ShoppingBag, ClipboardList } from "lucide-react";

export default function OrderConfirmedPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
        >
          <CheckCircle className="h-10 w-10 text-green-600" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 font-display text-3xl text-ink md:text-4xl"
      >
        Order confirmed
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 font-sans text-sm leading-relaxed text-ink-muted"
      >
        Thank you for your purchase. Your order has been placed successfully.
      </motion.p>

      {/* Order number pill */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 inline-flex rounded-full border border-gold/30 bg-gold/5 px-6 py-2.5"
      >
        <span className="font-sans text-sm font-medium tracking-wide text-gold">
          #{orderNumber}
        </span>
      </motion.div>

      {/* Confirmation details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 w-full max-w-md rounded-[24px] border border-ivory-deep bg-white/70 p-6 text-left backdrop-blur"
      >
        <dl className="space-y-3 font-sans text-sm text-ink-muted">
          <div className="flex justify-between">
            <dt>Order number</dt>
            <dd className="font-medium text-ink">{orderNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Payment</dt>
            <dd className="font-medium text-green-700">Paid</dd>
          </div>
          <div className="flex justify-between">
            <dt>Estimated delivery</dt>
            <dd className="font-medium text-ink">5–7 business days</dd>
          </div>
        </dl>
        <p className="mt-5 border-t border-ivory-deep pt-4 text-xs text-ink-soft">
          A confirmation email has been sent. You can track your order from your account.
        </p>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 rounded-full border border-gold px-8 py-3 font-sans text-[11px] uppercase tracking-[0.26em] text-gold hover:bg-gold hover:text-white transition-colors"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Continue shopping
        </Link>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 font-sans text-[11px] uppercase tracking-[0.26em] text-ivory hover:bg-gold transition-colors"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          View my orders
        </Link>
      </motion.div>
    </div>
  );
}
