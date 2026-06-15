"use client";

import { useEffect, useRef } from "react";
import { useUser, useAuth as useClerkAuthHook } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

/**
 * Hook that bridges Clerk authentication with the existing JWT auth system.
 * When a user signs in via Clerk (OTP, Email, or Google), this hook
 * exchanges the Clerk session for a local JWT and persists it.
 */
export function useClerkBridge() {
  const { isSignedIn, user: clerkUser } = useUser();
  const { user: localUser, finishOAuthLogin } = useAuth();
  const exchanged = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !clerkUser || localUser || exchanged.current) return;

    exchanged.current = true;

    void (async () => {
      try {
        const res = await apiFetch<{ token: string; user: { id: string; email: string; name: string; role: string; wishlist?: string[] } }>(
          "/auth/clerk/exchange",
          {
            method: "POST",
            body: JSON.stringify({ clerkUserId: clerkUser.id }),
          },
        );
        // Use the existing finishOAuthLogin flow to persist the token
        await finishOAuthLogin(res.token);
      } catch (err) {
        console.error("[Clerk Bridge] Token exchange failed:", err);
        exchanged.current = false;
      }
    })();
  }, [isSignedIn, clerkUser, localUser, finishOAuthLogin]);
}
