"use client";

import { useCallback, useRef, useState } from "react";
import { authInputClass } from "@/components/auth/AuthField";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
  createRecaptchaVerifier,
  getFirebaseIdToken,
  isFirebaseConfigured,
  sendOtp,
} from "@/lib/firebase";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { cn } from "@/lib/cn";

type Props = {
  disabled?: boolean;
  onSuccess?: () => void;
  className?: string;
};

type Step = "phone" | "otp" | "verifying";

export function PhoneSignIn({ disabled, onSuccess, className }: Props) {
  const { finishOAuthLogin } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const initRecaptcha = useCallback(() => {
    if (recaptchaRef.current) return recaptchaRef.current;
    const verifier = createRecaptchaVerifier("recaptcha-container-phone");
    recaptchaRef.current = verifier;
    return verifier;
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = phone.trim();
    if (!cleaned || cleaned.length < 10) {
      setError("Enter a valid phone number with country code (e.g. +91XXXXXXXXXX).");
      return;
    }

    setLoading(true);
    try {
      const verifier = initRecaptcha();
      const result = await sendOtp(cleaned, verifier);
      confirmationRef.current = result;
      setStep("otp");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      if (msg.includes("too-many-requests")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (msg.includes("invalid-phone-number")) {
        setError("Invalid phone number format. Include country code (e.g. +91).");
      } else {
        setError(msg);
      }
      // Reset reCAPTCHA on failure
      recaptchaRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code sent to your phone.");
      return;
    }

    if (!confirmationRef.current) {
      setError("Session expired. Please request a new OTP.");
      setStep("phone");
      return;
    }

    setLoading(true);
    setStep("verifying");
    try {
      // Verify OTP with Firebase (client-side)
      await confirmationRef.current.confirm(otp.trim());

      // Get the Firebase ID token
      const idToken = await getFirebaseIdToken();
      if (!idToken) throw new Error("Could not retrieve verification token.");

      // Exchange Firebase token for our app session (backend verifies + creates session)
      const res = await apiFetch<{ token: string; user: unknown }>("/auth/phone", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      // Use the same flow as OAuth — hydrate session from access token
      await finishOAuthLogin(res.token);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      if (msg.includes("invalid-verification-code") || msg.includes("code-expired")) {
        setError("Incorrect or expired code. Please try again.");
      } else {
        setError(msg);
      }
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured()) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container-phone" ref={recaptchaContainerRef} />

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading || disabled}
              className={cn(authInputClass, "flex-1")}
            />
            <button
              type="submit"
              disabled={loading || disabled}
              className="shrink-0 rounded-2xl bg-ink px-5 py-3 font-sans text-[10px] uppercase tracking-[0.2em] text-ivory transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </div>
        </form>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <p className="font-sans text-xs text-ink-muted">
            Enter the 6-digit code sent to <span className="font-medium text-ink">{phone}</span>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="______"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={loading || disabled}
              className={cn(authInputClass, "flex-1 text-center tracking-[0.5em]")}
            />
            <button
              type="submit"
              disabled={loading || disabled}
              className="shrink-0 rounded-2xl bg-ink px-5 py-3 font-sans text-[10px] uppercase tracking-[0.2em] text-ivory transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setStep("phone"); setOtp(""); setError(null); }}
            className="font-sans text-xs text-ink-muted transition hover:text-gold"
          >
            ← Change number
          </button>
        </form>
      ) : null}

      {step === "verifying" ? (
        <p className="py-3 text-center font-sans text-sm text-ink-muted animate-pulse">
          Verifying…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 font-sans text-xs text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
