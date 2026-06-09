"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Globe, ImageIcon, Megaphone, Package, Percent, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

const ACTIONS = [
  { label: "New Product", href: "/admin/products", icon: Package, shortcut: "⌘⇧P" },
  { label: "New Coupon", href: "/admin/coupons", icon: Percent },
  { label: "Upload Media", href: "/admin/media", icon: ImageIcon },
  { label: "Publish Homepage", href: "/admin/website/pages", icon: Globe },
  { label: "Announcement", href: "/admin/website/announcement-bar", icon: Megaphone },
];

/**
 * Global quick-create floating menu accessible from every page.
 * Trigger: "+" button in the top bar.
 */
export function AdminQuickCreate() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Keyboard shortcut: ⌘+Shift+N
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition",
          open
            ? "bg-[var(--admin-accent)] text-white shadow-md"
            : "border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-ink)]",
        )}
        aria-label="Quick create"
        title="Create new (⌘⇧N)"
      >
        <Plus className={cn("h-4 w-4 transition", open && "rotate-45")} strokeWidth={2} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] shadow-lg">
          <p className="border-b border-[var(--admin-border)] px-3 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
            Quick create
          </p>
          <div className="p-1.5">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-[var(--admin-radius-xs)] px-2.5 py-2 font-sans text-sm text-[var(--admin-ink)] transition hover:bg-[var(--admin-surface-raised)]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[var(--admin-accent)]" strokeWidth={1.5} />
                  <span className="min-w-0 flex-1">{action.label}</span>
                  {action.shortcut ? (
                    <kbd className="shrink-0 rounded border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-1 py-0.5 font-mono text-[9px] text-[var(--admin-faint)]">
                      {action.shortcut}
                    </kbd>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
