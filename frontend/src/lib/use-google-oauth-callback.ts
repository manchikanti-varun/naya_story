"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Legacy OAuth callback handler for /login and /register pages.
 *
 * With the new opaque session code pattern, the backend now redirects to
 * /auth/callback?code=<opaque> instead of /login?code=<jwt>.
 *
 * This hook exists for backward compatibility: if a stale redirect arrives
 * at /login?code= it redirects to the proper callback page.
 */
export function useGoogleOAuthCallback(redirectTo = "/account") {
  const params = useSearchParams();
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    // If code arrives here (legacy behavior), redirect to the proper callback page
    const code = params.get("code") || params.get("token");
    if (!code) return;

    setOauthLoading(true);
    // Redirect to the proper auth callback page which handles the exchange
    router.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
  }, [params, router, redirectTo]);

  return { oauthLoading: oauthLoading || Boolean(params.get("code") || params.get("token")) };
}
