"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type ExchangeResponse = {
  success: boolean;
  token: string;
  user: { id: string; email: string; name: string; role: string; wishlist?: string[] };
};

/**
 * OAuth callback page — exchanges an opaque session code for a JWT.
 *
 * Flow:
 * 1. Backend redirects here with ?code=<opaque_64_char_hex>
 * 2. This page POSTs the code to /api/auth/session/exchange
 * 3. On success: persists session, clears URL, redirects to /account
 * 4. On failure: redirects to /login?error=session_expired
 */
export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { finishOAuthLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const exchangedRef = useRef(false);

  useEffect(() => {
    const code = params.get("code");

    if (!code) {
      router.replace("/login?error=session_expired");
      return;
    }

    // Prevent double-exchange in React StrictMode
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    void (async () => {
      try {
        // Exchange opaque code for JWT via POST body (never URL param)
        const response = await apiFetch<ExchangeResponse>("/auth/session/exchange", {
          method: "POST",
          body: JSON.stringify({ code }),
        });

        if (!response.success || !response.token) {
          throw new Error("Exchange failed");
        }

        // Hydrate session using the received access token
        await finishOAuthLogin(response.token);

        // Clean URL: remove code from browser history to prevent replay
        window.history.replaceState({}, "", "/auth/callback");

        // Redirect to account
        router.replace("/account");
      } catch {
        setError("Session expired. Please sign in again.");
        // Redirect to login after brief delay so user sees the message
        setTimeout(() => {
          router.replace("/login?error=session_expired");
        }, 1500);
      }
    })();
  }, [params, router, finishOAuthLogin]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="font-sans text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
      <p className="mt-4 font-sans text-sm text-ink-muted">Signing you in…</p>
    </div>
  );
}
