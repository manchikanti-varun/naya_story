"use client";

import { useClerk } from "@clerk/nextjs";

/**
 * Custom OTP sign-in trigger.
 * Opens Clerk's sign-in modal (which supports phone OTP, email OTP, Google)
 * without rendering inline. This keeps the existing login UI clean.
 */
export function ClerkOtpButton({ disabled }: { disabled?: boolean }) {
  const clerk = useClerk();

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => clerk.openSignIn()}
      className="w-full rounded-full border border-ivory-deep/60 bg-white/50 py-4 font-sans text-[11px] uppercase tracking-[0.3em] text-ink transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
    >
      Sign in with Phone / Email OTP
    </button>
  );
}
