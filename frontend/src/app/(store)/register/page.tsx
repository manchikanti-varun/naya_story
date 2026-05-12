"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/account");
  }, [loading, user, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-24">
      <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Join quietly</p>
      <h1 className="mt-4 font-display text-4xl text-ink">Register</h1>
      <form
        className="mt-10 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            await register({ name, email, password });
            router.push("/account");
          } catch {
            setError("Could not create account — email may already exist.");
          }
        }}
      >
        <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>
        <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>
        <label className="block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          Password (min 8)
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>
        {error ? <p className="font-sans text-sm text-red-700">{error}</p> : null}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className="w-full rounded-full bg-gold py-4 font-sans text-[11px] uppercase tracking-[0.3em] text-white hover:bg-ink"
        >
          Create account
        </motion.button>
      </form>
      <p className="mt-10 text-center font-sans text-sm text-ink-muted">
        Already with us?{" "}
        <Link href="/login" className="text-gold underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
