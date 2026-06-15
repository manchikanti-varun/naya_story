"use client";

import { SignIn } from "@clerk/nextjs";

/**
 * Clerk Sign-In component with phone OTP, email OTP, and Google support.
 * Renders inline in the login page alongside existing email/password form.
 */
export function ClerkSignIn() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) return null;

  return (
    <div className="flex justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border border-ivory-deep/30 rounded-2xl bg-white/60",
            headerTitle: "font-display text-xl text-ink",
            headerSubtitle: "font-sans text-sm text-ink-muted",
            formButtonPrimary: "bg-ink hover:bg-gold text-ivory font-sans text-[11px] uppercase tracking-[0.3em] rounded-full py-3",
            formFieldInput: "rounded-xl border-ivory-deep/40 font-sans text-sm",
            footerActionLink: "text-gold hover:text-gold/80",
            dividerLine: "bg-ivory-deep/30",
            dividerText: "text-ink-soft font-sans text-xs",
          },
        }}
        routing="hash"
        signUpUrl="/register"
        forceRedirectUrl="/account"
      />
    </div>
  );
}
