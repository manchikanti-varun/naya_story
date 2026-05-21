"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";

/** Handles `?token=` after Google OAuth (API redirects to `/login` or `/register`). */
export function useGoogleOAuthCallback(redirectTo = "/account") {
  const params = useSearchParams();
  const router = useRouter();
  const { finishOAuthLogin } = useAuth();
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const token = params.get("token");
    if (!token) return;

    setOauthLoading(true);
    void (async () => {
      try {
        await finishOAuthLogin(token);
        router.replace(redirectTo);
      } catch {
        router.replace("/login?error=google");
      }
    })();
  }, [params, router, finishOAuthLogin, redirectTo]);

  return { oauthLoading: oauthLoading || Boolean(params.get("token")) };
}
