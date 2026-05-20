"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminBrand } from "@/components/admin/AdminBrand";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const { adminLogin, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.role === "admin") router.replace("/admin");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans text-sm text-[var(--admin-muted)]">
        Loading…
      </div>
    );
  }

  if (user?.role === "admin") return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--admin-canvas)] px-4 py-12">
      <div className="w-full max-w-[400px] rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 shadow-[0_24px_64px_-32px_rgba(28,25,23,0.22)]">
        <AdminBrand href="/admin/login" showSubtitle className="mb-8" />

        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-faint)]">
          Staff only
        </p>
        <h1 className="mt-2 font-display text-2xl text-[var(--admin-ink)]">Sign in to admin</h1>
        <p className="mt-2 font-sans text-sm text-[var(--admin-muted)]">
          Manage products, orders, and website content.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setSubmitting(true);
            try {
              await adminLogin(email, password);
              router.push("/admin");
            } catch (err) {
              setError(
                err instanceof ApiError
                  ? err.message
                  : "Unable to sign in — check your credentials.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <AdminField label="Email">
            <AdminInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </AdminField>
          <AdminField label="Password">
            <AdminInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </AdminField>
          {error ? <p className="font-sans text-sm text-red-700">{error}</p> : null}
          <AdminButton type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </AdminButton>
        </form>
      </div>

      <Link
        href="/"
        className="mt-8 font-sans text-sm text-[var(--admin-muted)] underline-offset-4 hover:text-[var(--admin-ink)] hover:underline"
      >
        Back to store
      </Link>
    </div>
  );
}
