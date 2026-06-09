"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Package, PackageX, ShoppingBag } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";

type Notification = {
  id: string;
  type: "low_stock" | "out_of_stock" | "pending_orders" | "info";
  title: string;
  description: string;
  href: string;
  read: boolean;
};

/**
 * Admin notification center — shows inventory alerts and pending order notifications.
 * Data fetched from /admin/overview on mount.
 */
export function AdminNotifications() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const data = await apiFetch<{
          lowStock: { name: string; slug: string }[];
          outOfStockCount: number;
          pendingOrdersCount: number;
        }>("/admin/overview", { token });

        const notifs: Notification[] = [];
        if (data.pendingOrdersCount > 0) {
          notifs.push({
            id: "pending-orders",
            type: "pending_orders",
            title: `${data.pendingOrdersCount} orders need action`,
            description: "Pending, confirmed, or packed",
            href: "/admin/orders",
            read: false,
          });
        }
        if (data.outOfStockCount > 0) {
          notifs.push({
            id: "out-of-stock",
            type: "out_of_stock",
            title: `${data.outOfStockCount} products out of stock`,
            description: "Fully depleted — customers can't purchase",
            href: "/admin/inventory",
            read: false,
          });
        }
        if (data.lowStock?.length > 0) {
          notifs.push({
            id: "low-stock",
            type: "low_stock",
            title: `${data.lowStock.length} products low on stock`,
            description: "Under 5 units remaining",
            href: "/admin/inventory",
            read: false,
          });
        }
        setNotifications(notifs);
      } catch {}
    })();
  }, [token]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const iconForType = (type: Notification["type"]) => {
    switch (type) {
      case "pending_orders": return ShoppingBag;
      case "out_of_stock": return PackageX;
      case "low_stock": return AlertTriangle;
      default: return Bell;
    }
  };

  const toneForType = (type: Notification["type"]) => {
    switch (type) {
      case "pending_orders": return "text-blue-600 bg-blue-50";
      case "out_of_stock": return "text-red-600 bg-red-50";
      case "low_stock": return "text-amber-600 bg-amber-50";
      default: return "text-[var(--admin-faint)] bg-[var(--admin-surface-raised)]";
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-ink)]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-sans text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3">
            <p className="font-sans text-sm font-semibold text-[var(--admin-ink)]">Notifications</p>
            {unreadCount > 0 ? (
              <button type="button" onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                className="font-sans text-[10px] font-medium text-[var(--admin-accent)] hover:underline">
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center font-sans text-sm text-[var(--admin-muted)]">No notifications</p>
            ) : (
              <div className="divide-y divide-[var(--admin-border)]">
                {notifications.map((notif) => {
                  const Icon = iconForType(notif.type);
                  return (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => { markRead(notif.id); setOpen(false); }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--admin-surface-raised)]",
                        !notif.read && "bg-[var(--admin-accent-soft)]/30",
                      )}
                    >
                      <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", toneForType(notif.type))}>
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-sans text-sm", !notif.read ? "font-medium text-[var(--admin-ink)]" : "text-[var(--admin-muted)]")}>
                          {notif.title}
                        </p>
                        <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">{notif.description}</p>
                      </div>
                      {!notif.read ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--admin-accent)]" /> : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
