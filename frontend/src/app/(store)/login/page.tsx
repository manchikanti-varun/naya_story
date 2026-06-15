"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthField, authInputClass } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { ClerkSignIn } from "@/components/auth/ClerkSignIn";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/context/auth-context";
import { useClerkBridge } from "@/lib/use-clerk-auth";
import {
  formatAuthError,
  normalizeEmail,
  validateLoginInput,
} from "@/lib/auth-form";
import { useGoogleOAuthCallback } from "@/lib/use-google-oauth-callback";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          kicker=""
          title=""
          subtitle=""
          oauthLoading
          footer={null}
        >
          {null}
        </AuthShell>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { oauthLoading } = useGoogleOAuthCallback("/account");
  useClerkBridge();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<"credentials" | "otp">("credentials");

  useEffect(() => {
    const err = params.get("error");
    if (err === "admin_portal") {
      setError("Administrator accounts must sign in at /admin/login.");
    } else if (err === "google") {
      setError("Google sign-in was cancelled or failed. Please try again.");
    }
    if (params.get("registered") === "1") {
      setError(null);
    }
  }, [params]);

  useEffect(() => {
    if (!loading && user && !params.get("token")) router.replace("/account");
  }, [loading, user, router, params]);

  const registered = params.get("registered") === "1";

  return (
    <AuthShell
      kicker="Welcome back"
      title="Sign in"
      subtitle="Access your wishlist, orders, and saved addresses with one secure account."
      oauthLoading={oauthLoading}
      footer={
        <p className="text-center font-sans text-sm text-ink-muted">
          New to the studio?{" "}
          <Link href="/register" className="font-medium text-gold underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      {registered ? (
        <p
          role="status"
          className="mb-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 font-sans text-sm text-emerald-900"
        >
          Account created. Sign in with your email and password below.
        </p>
      ) : null}

      <form
        className="space-y-5"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setFieldError(null);
          const validation = validateLoginInput(email, password);
          if (validation) {
            setFieldError(validation);
            return;
          }
          setSubmitting(true);
          try {
            await login(normalizeEmail(email), password);
            router.replace("/account");
          } catch (err) {
            setError(
              formatAuthError(err, "Unable to sign in. Check your email and password."),
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <AuthField label="Email" htmlFor="login-email">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
            className={authInputClass}
          />
        </AuthField>

        <AuthField label="Password" htmlFor="login-password">
          <PasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
            disabled={submitting}
          />
        </AuthField>

        {fieldError ? (
          <p role="alert" className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 font-sans text-sm text-red-800">
            {fieldError}
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 font-sans text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-ink py-4 font-sans text-[11px] uppercase tracking-[0.3em] text-ivory transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6">
        <AuthDivider />
        <div className="mt-6 space-y-4">
          {authMode === "credentials" ? (
            <>
              <GoogleSignInButton disabled={submitting} />
              {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
                <button
                  type="button"
                  onClick={() => setAuthMode("otp")}
                  className="w-full rounded-full border border-ivory-deep/60 bg-white/50 py-4 font-sans text-[11px] uppercase tracking-[0.3em] text-ink transition hover:border-gold/40 hover:text-gold"
                >
                  Sign in with Phone / Email OTP
                </button>
              )}
            </>
          ) : (
            <>
              <ClerkSignIn />
              <button
                type="button"
                onClick={() => setAuthMode("credentials")}
                className="w-full rounded-full border border-ivory-deep/60 bg-white/50 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-ink-muted transition hover:border-gold/40 hover:text-gold"
              >
                ← Back to email & password
              </button>
            </>
          )}
        </div>
        <p className="mt-4 text-center font-sans text-xs leading-relaxed text-ink-soft">
          By continuing, you agree to our{" "}
          <Link href="/policies/terms" className="text-ink-muted underline-offset-2 hover:text-gold hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/policies/privacy" className="text-ink-muted underline-offset-2 hover:text-gold hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
