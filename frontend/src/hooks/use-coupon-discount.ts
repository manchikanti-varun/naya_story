"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type ValidateResponse = {
  valid: boolean;
  discount: number;
  code: string | null;
};

export function useCouponDiscount(coupon: string | undefined, subtotal: number) {
  const [discount, setDiscount] = useState(0);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!coupon?.trim() || subtotal <= 0) {
      setDiscount(0);
      return;
    }

    let cancelled = false;
    setValidating(true);
    void (async () => {
      try {
        const res = await apiFetch<ValidateResponse>("/coupons/validate", {
          method: "POST",
          body: JSON.stringify({ code: coupon, subtotal }),
        });
        if (!cancelled) setDiscount(res.valid ? res.discount : 0);
      } catch {
        if (!cancelled) setDiscount(0);
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coupon, subtotal]);

  return { discount, validating };
}

export async function validateCouponCode(
  code: string,
  subtotal: number,
): Promise<ValidateResponse> {
  return apiFetch<ValidateResponse>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
}
