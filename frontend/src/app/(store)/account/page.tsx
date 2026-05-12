"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function AccountHomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-10 rounded-[32px] border border-ivory-deep bg-white/70 p-10 backdrop-blur">
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Studio profile</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Welcome, {user?.name.split(" ")[0]}.</h1>
        <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-ink-muted">
          Your wishlist, shipment timelines, and addresses stay here — calm, organized, within reach.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/account/orders"
          className="rounded-[24px] border border-ivory-deep bg-ivory-muted/40 p-6 transition hover:border-gold"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">Orders</p>
          <p className="mt-3 font-display text-2xl text-ink">Track shipments</p>
        </Link>
        <Link
          href="/account/wishlist"
          className="rounded-[24px] border border-ivory-deep bg-ivory-muted/40 p-6 transition hover:border-gold"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">Wishlist</p>
          <p className="mt-3 font-display text-2xl text-ink">Saved silhouettes</p>
        </Link>
        <Link
          href="/account/addresses"
          className="rounded-[24px] border border-ivory-deep bg-ivory-muted/40 p-6 transition hover:border-gold"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink-soft">Addresses</p>
          <p className="mt-3 font-display text-2xl text-ink">Delivery book</p>
        </Link>
      </div>
    </div>
  );
}
