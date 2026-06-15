"use client";

import { ClerkProvider } from "@clerk/nextjs";

/**
 * Clerk provider wrapper.
 * Only renders ClerkProvider if the publishable key is configured.
 * This allows the app to work with or without Clerk.
 */
export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    // Clerk not configured — pass through
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/register"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
