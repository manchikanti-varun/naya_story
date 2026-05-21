"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthField, authInputClass } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PasswordStrengthHint } from "@/components/auth/PasswordStrengthHint";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/context/auth-context";
import {
  formatAuthError,
  normalizeEmail,
  validateRegisterInput,
} from "@/lib/auth-form";
import { useGoogleOAuthCallback } from "@/lib/use-google-oauth-callback";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthShell kicker="" title="" subtitle="" oauthLoading footer={null}>
          {null}
        </AuthShell>
      }
    >
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { oauthLoading } = useGoogleOAuthCallback("/account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const err = params.get("error");
    if (err === "google") {
      setError("Google sign-in was cancelled or failed. Please try again.");
    }
  }, [params]);

  useEffect(() => {
    if (!loading && user && !params.get("token")) router.replace("/account");
  }, [loading, user, router, params]);

  return (
    <AuthShell
      kicker="Join quietly"
      title="Create account"
      subtitle="Save wishlists, track orders, and checkout faster — one profile for the whole studio."
      oauthLoading={oauthLoading}
      footer={
        <p className="text-center font-sans text-sm text-ink-muted">
          Already with us?{" "}
          <Link href="/login" className="font-medium text-gold underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setFieldError(null);
          const validation = validateRegisterInput(name, email, password, confirmPassword);
          if (validation) {
            setFieldError(validation);
            return;
          }
          setSubmitting(true);
          try {
            await register({
              name: name.trim(),
              email: normalizeEmail(email),
              password,
            });
            router.replace("/account");
          } catch (err) {
            setError(
              formatAuthError(
                err,
                "Could not create your account. This email may already be registered.",
              ),
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <AuthField label="Full name" htmlFor="register-name">
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            required
            minLength={2}
            className={authInputClass}
          />
        </AuthField>

        <AuthField label="Email" htmlFor="register-email">
          <input
            id="register-email"
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

        <AuthField
          label="Password"
          htmlFor="register-password"
          hint="At least 8 characters. Stronger passwords help protect your account."
        >
          <PasswordInput
            id="register-password"
            value={password}
            onChange={setPassword}
            minLength={8}
            autoComplete="new-password"
            required
            disabled={submitting}
          />
          <div className="mt-2">
            <PasswordStrengthHint password={password} />
          </div>
        </AuthField>

        <AuthField label="Confirm password" htmlFor="register-confirm">
          <PasswordInput
            id="register-confirm"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
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
          className="w-full rounded-full bg-gold py-4 font-sans text-[11px] uppercase tracking-[0.3em] text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-6">
        <AuthDivider />
        <div className="mt-6">
          <GoogleSignInButton disabled={submitting} />
        </div>
        <p className="mt-4 text-center font-sans text-xs leading-relaxed text-ink-soft">
          By creating an account, you agree to our{" "}
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
