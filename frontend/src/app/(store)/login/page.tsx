"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, googleAuthUrl } from "@/lib/api";
import type { User } from "@/types";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-24">
          <p className="font-sans text-sm text-ink-muted">Opening sign-in…</p>
        </div>
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
  const [email, setEmail] = useState("client@nayastudio.com");
  const [password, setPassword] = useState("Client123!");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) return;
    localStorage.removeItem("naya_user");
    localStorage.setItem("naya_token", token);
    void (async () => {
      try {
        const me = await apiFetch<{ user: User }>("/auth/me", { token });
        window.location.href = me.user.role === "admin" ? "/admin" : "/account";
      } catch {
        window.location.href = "/account";
      }
    })();
  }, [params]);

  useEffect(() => {
    if (!loading && user) router.replace(user.role === "admin" ? "/admin" : "/account");
  }, [loading, user, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-24">
      <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Welcome back</p>
      <h1 className="mt-4 font-display text-4xl text-ink">Sign in</h1>
      <p className="mt-3 font-sans text-sm text-ink-muted">
        Access wishlists, orders, and saved addresses.
      </p>

      <form
        className="mt-10 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const signedIn = await login(email, password);
            router.push(signedIn.role === "admin" ? "/admin" : "/account");
          } catch {
            setError("Unable to sign in — check your credentials.");
          }
        }}
      >
        <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>
        <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>
        {error ? <p className="font-sans text-sm text-red-700">{error}</p> : null}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className="w-full rounded-full bg-ink py-4 font-sans text-[11px] uppercase tracking-[0.3em] text-ivory hover:bg-gold"
        >
          Continue
        </motion.button>
      </form>

      <a
        href={googleAuthUrl}
        className="mt-6 flex w-full items-center justify-center rounded-full border border-ivory-deep py-4 font-sans text-[11px] uppercase tracking-[0.26em] text-ink hover:border-gold hover:text-gold"
      >
        Continue with Google
      </a>

      <p className="mt-10 text-center font-sans text-sm text-ink-muted">
        New to the studio?{" "}
        <Link href="/register" className="text-gold underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
