"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { flattenNavItems } from "@/lib/admin/nav-config";
import { cn } from "@/lib/cn";

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const items = useMemo(() => flattenNavItems(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items.filter((item) => {
      const hay = `${item.label} ${item.href} ${(item.keywords ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-command-trigger hidden items-center gap-2 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 font-sans text-xs text-[var(--admin-muted)] shadow-sm transition hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-ink)] lg:inline-flex"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        <span>Search</span>
        <kbd className="ml-2 rounded border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--admin-faint)]">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-stone-900/25 px-4 pt-[12vh] backdrop-blur-[2px]">
          <button type="button" className="absolute inset-0" aria-label="Close search" onClick={close} />
          <div
            role="dialog"
            aria-modal
            aria-label="Command palette"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-4 py-3">
              <Search className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.75} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a page…"
                className="flex-1 bg-transparent font-sans text-sm text-[var(--admin-ink)] outline-none placeholder:text-[var(--admin-faint)]"
              />
            </div>
            <ul className="max-h-[min(50vh,360px)] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center font-sans text-sm text-[var(--admin-muted)]">No matches</li>
              ) : (
                filtered.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="flex items-center justify-between gap-3 rounded-[var(--admin-radius-sm)] px-3 py-2.5 font-sans text-sm text-[var(--admin-ink)] transition hover:bg-black/[0.04]"
                    >
                      <span>{item.label}</span>
                      <span className="truncate font-mono text-[10px] text-[var(--admin-faint)]">{item.href}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
