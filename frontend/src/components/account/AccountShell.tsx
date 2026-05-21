"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-32 md:px-10">
        <p className="font-sans text-sm text-ink-muted">Opening your profile…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-12 px-6 py-16 md:flex-row md:gap-16 md:px-10 md:py-24">
      <aside className="store-elevated-card w-full shrink-0 p-6 md:w-64">
        <p className="font-display text-2xl text-ink">{user.name}</p>
        <p className="mt-2 font-sans text-xs uppercase tracking-[0.22em] text-ink-soft">
          {user.email}
        </p>
        <nav className="mt-10 space-y-3 font-sans text-sm uppercase tracking-[0.18em] text-ink-muted">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "block rounded-full px-4 py-2 transition-colors hover:bg-white hover:text-gold",
                pathname === l.href && "bg-white text-gold",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-ivory-deep px-4 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-ink-muted hover:border-gold hover:text-gold"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.25} />
          Sign out
        </button>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
