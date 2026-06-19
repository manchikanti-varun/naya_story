"use client";

import { Gift, Truck } from "lucide-react";

const FREE_SHIPPING = 15_000;

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(FREE_SHIPPING - subtotal, 0);
  const progress = Math.min((subtotal / FREE_SHIPPING) * 100, 100);
  const achieved = subtotal >= FREE_SHIPPING;

  return (
    <div className="px-4 py-3 border-b border-neutral-100">
      <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1.5">
        {achieved ? (
          <>
            <Gift className="h-3.5 w-3.5 text-gold" />
            You have complimentary shipping on this order
          </>
        ) : (
          <>
            <Truck className="h-3.5 w-3.5" />
            ₹{remaining.toLocaleString("en-IN")} away from complimentary shipping
          </>
        )}
      </p>
      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-gold)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
