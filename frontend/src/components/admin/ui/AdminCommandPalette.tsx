"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Globe,
  ImageIcon,
  Package,
  Percent,
  Plus,
  Search,
  ShoppingBag,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { flattenNavItems } from "@/lib/admin/nav-config";
import { cn } from "@/lib/cn";

type CommandItem = {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  category: "navigation" | "action" | "recent";
  keywords?: string[];
  shortcut?: string;
};

function buildCommandItems(): CommandItem[] {
  const navItems = flattenNavItems();
  const navigation: CommandItem[] = navItems.map((item) => ({
    id: `nav-${item.href}`,
    label: item.label,
    href: item.href,
    icon: item.icon,
    category: "navigation" as const,
    keywords: item.keywords,
  }));

  const actions: CommandItem[] = [
    { id: "act-new-product", label: "Create Product", href: "/admin/products", icon: Plus, category: "action", keywords: ["new", "add", "create"], shortcut: "⌘⇧P" },
    { id: "act-new-coupon", label: "Create Coupon", href: "/admin/coupons", icon: Percent, category: "action", keywords: ["discount", "code", "new"] },
    { id: "act-upload", label: "Upload Media", href: "/admin/media", icon: Upload, category: "action", keywords: ["image", "upload", "file"] },
    { id: "act-publish", label: "Publish Homepage", href: "/admin/website/pages", icon: Globe, category: "action", keywords: ["cms", "live", "deploy"] },
    { id: "act-analytics", label: "Open Analytics", href: "/admin/analytics", icon: BarChart3, category: "action", keywords: ["reports", "revenue"] },
  ];

  return [...actions, ...navigation];
}

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allItems = useMemo(() => buildCommandItems(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show actions first, then navigation (limited)
      const actions = allItems.filter((i) => i.category === "action");
      const nav = allItems.filter((i) => i.category === "navigation").slice(0, 8);
      return [...actions, ...nav];
    }
    return allItems.filter((item) => {
      const hay = `${item.label} ${item.href} ${(item.keywords ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    }).slice(0, 15);
  }, [allItems, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const item = filtered[activeIdx];
        if (item) {
          close();
          window.location.href = item.href;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, activeIdx, close]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // Group filtered items
  const grouped = useMemo(() => {
    const groups: { label: string; items: (CommandItem & { idx: number })[] }[] = [];
    let idx = 0;
    const actions = filtered.filter((i) => i.category === "action");
    const nav = filtered.filter((i) => i.category === "navigation");
    if (actions.length) groups.push({ label: "Actions", items: actions.map((i) => ({ ...i, idx: idx++ })) });
    if (nav.length) groups.push({ label: "Pages", items: nav.map((i) => ({ ...i, idx: idx++ })) });
    return groups;
  }, [filtered]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-command-trigger inline-flex items-center gap-2 rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 py-1.5 font-sans text-xs text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-ink)] sm:px-3"
        aria-label="Command palette"
      >
        <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--admin-faint)] sm:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-stone-900/25 px-4 pt-[10vh] backdrop-blur-[2px]">
          <button type="button" className="absolute inset-0" aria-label="Close" onClick={close} />
          <div
            role="dialog"
            aria-modal
            aria-label="Command palette"
            className="admin-command-dialog relative z-10 w-full max-w-xl overflow-hidden border border-[var(--admin-border-strong)] bg-[var(--admin-surface)]"
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-[var(--admin-faint)]" strokeWidth={1.75} />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, actions, products…"
                className="flex-1 bg-transparent font-sans text-sm text-[var(--admin-ink)] outline-none placeholder:text-[var(--admin-faint)]"
              />
              <kbd className="rounded border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--admin-faint)]">ESC</kbd>
            </div>

            {/* Results */}
            <ul ref={listRef} className="max-h-[min(55vh,420px)] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <li className="px-3 py-8 text-center font-sans text-sm text-[var(--admin-muted)]">No results found</li>
              ) : (
                grouped.map((group) => (
                  <li key={group.label}>
                    <p className="px-3 pb-1 pt-2 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">
                      {group.label}
                    </p>
                    <ul>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.idx === activeIdx;
                        return (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              onClick={close}
                              className={cn(
                                "admin-command-item flex items-center gap-3 rounded-[var(--admin-radius-xs)] px-3 py-2.5 transition",
                                isActive ? "bg-[var(--admin-accent-soft)] text-[var(--admin-ink)]" : "text-[var(--admin-ink)] hover:bg-[var(--admin-surface-raised)]",
                              )}
                            >
                              {Icon ? (
                                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[var(--admin-accent)]" : "text-[var(--admin-faint)]")} strokeWidth={1.5} />
                              ) : (
                                <span className="h-4 w-4 shrink-0" />
                              )}
                              <span className="min-w-0 flex-1 font-sans text-sm">{item.label}</span>
                              {item.shortcut ? (
                                <kbd className="shrink-0 rounded border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--admin-faint)]">
                                  {item.shortcut}
                                </kbd>
                              ) : (
                                <span className="shrink-0 truncate font-mono text-[10px] text-[var(--admin-faint)]">{item.href.replace("/admin", "")}</span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-4 py-2">
              <div className="flex items-center gap-3 font-sans text-[10px] text-[var(--admin-faint)]">
                <span className="inline-flex items-center gap-1"><kbd className="rounded border border-[var(--admin-border)] px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
                <span className="inline-flex items-center gap-1"><kbd className="rounded border border-[var(--admin-border)] px-1 py-0.5 font-mono">⏎</kbd> open</span>
                <span className="inline-flex items-center gap-1"><kbd className="rounded border border-[var(--admin-border)] px-1 py-0.5 font-mono">esc</kbd> close</span>
              </div>
              <span className="font-sans text-[10px] text-[var(--admin-faint)]">
                <Zap className="mr-0.5 inline h-3 w-3" strokeWidth={1.75} /> Quick actions
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
