"use client";

import { useEffect } from "react";
import { Calendar, Mail, MapPin, ShoppingBag, User, X } from "lucide-react";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";

type CustomerData = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

type Props = {
  customer: CustomerData | null;
  onClose: () => void;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function CustomerDetailDrawer({ customer, onClose }: Props) {
  useEffect(() => {
    if (!customer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [customer, onClose]);

  if (!customer) return null;

  const aov = customer.orderCount > 0 ? Math.round(customer.totalSpent / customer.orderCount) : 0;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--admin-ink)]/30 backdrop-blur-[3px]"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="admin-drawer-panel absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[var(--admin-border-strong)] bg-[var(--admin-surface)] shadow-2xl"
      >
        {/* Header */}
        <header className="admin-drawer-header flex shrink-0 items-start justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <p className="admin-metric-label text-[var(--admin-accent)]">Customer profile</p>
            <h2 className="mt-1 font-sans text-xl font-semibold text-[var(--admin-ink)]">
              {customer.name}
            </h2>
            <p className="mt-1 font-sans text-sm text-[var(--admin-muted)]">{customer.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        {/* Body */}
        <div className="admin-drawer-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <AdminCard padding="sm">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-faint)]">
                Lifetime value
              </p>
              <p className="mt-1.5 font-sans text-lg font-semibold tabular-nums text-[var(--admin-ink)]">
                {formatCurrency(customer.totalSpent)}
              </p>
            </AdminCard>
            <AdminCard padding="sm">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-faint)]">
                Total orders
              </p>
              <p className="mt-1.5 font-sans text-lg font-semibold tabular-nums text-[var(--admin-ink)]">
                {customer.orderCount}
              </p>
            </AdminCard>
            <AdminCard padding="sm">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-faint)]">
                Avg. order value
              </p>
              <p className="mt-1.5 font-sans text-lg font-semibold tabular-nums text-[var(--admin-ink)]">
                {aov > 0 ? formatCurrency(aov) : "—"}
              </p>
            </AdminCard>
            <AdminCard padding="sm">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-faint)]">
                Status
              </p>
              <div className="mt-2">
                <AdminBadge tone={customer.orderCount > 0 ? "success" : "neutral"}>
                  {customer.orderCount > 0 ? "Active buyer" : "No purchases"}
                </AdminBadge>
              </div>
            </AdminCard>
          </div>

          {/* Contact Info */}
          <AdminCard padding="md">
            <h3 className="mb-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[var(--admin-faint)]" strokeWidth={1.5} />
                <p className="font-sans text-sm text-[var(--admin-muted)]">{customer.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0 text-[var(--admin-faint)]" strokeWidth={1.5} />
                <p className="font-sans text-sm text-[var(--admin-muted)]">{customer.name}</p>
              </div>
            </div>
          </AdminCard>

          {/* Activity */}
          <AdminCard padding="md">
            <h3 className="mb-3 font-sans text-sm font-semibold text-[var(--admin-ink)]">Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 shrink-0 text-[var(--admin-faint)]" strokeWidth={1.5} />
                  <p className="font-sans text-sm text-[var(--admin-muted)]">Joined</p>
                </div>
                <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">
                  {formatDate(customer.createdAt)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-4 w-4 shrink-0 text-[var(--admin-faint)]" strokeWidth={1.5} />
                  <p className="font-sans text-sm text-[var(--admin-muted)]">Last purchase</p>
                </div>
                <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">
                  {formatDate(customer.lastOrderAt)}
                </p>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-4">
          <AdminButton variant="secondary" onClick={onClose}>
            Close
          </AdminButton>
        </footer>
      </aside>
    </div>
  );
}
