"use client";

import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { ClerkProviderWrapper } from "@/context/clerk-provider";
import { LuxuryProvider } from "@/components/luxury/LuxuryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProviderWrapper>
      <AuthProvider>
        <CartProvider>
          <LuxuryProvider>{children}</LuxuryProvider>
        </CartProvider>
      </AuthProvider>
    </ClerkProviderWrapper>
  );
}
