"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  StickyNote,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminAvatar } from "@/components/admin/ui/AdminAvatar";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminField";
import { AdminSplitView } from "@/components/admin/ui/AdminSplitView";
import { useToast } from "@/components/admin/ui/AdminToast";
import { cn } from "@/lib/cn";

// ============================================
// TYPES
// ============================================

type CustomerRow = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
};

type GuestBuyer = {
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

type CustomersResponse = {
  customers: CustomerRow[];
  guestBuyers: GuestBuyer[];
  summary: { registered: number; withOrders: number; guestOnly: number };
};

type Segment = "vip" | "high-value" | "active" | "new" | "inactive";

type ProfileTab = "orders" | "addresses" | "timeline" | "notes";

// ============================================
// SEGMENTATION LOGIC
// ============================================

function getSegments(c: CustomerRow): Segment[] {
  const segs: Segment[] = [];
  if (c.totalSpent >= 25000) segs.push("vip");
  else if (c.totalSpent >= 10000) segs.push("high-value");
  const joinedMs = Date.now() - new Date(c.createdAt).getTime();
  if (joinedMs < 30 * 24 * 60 * 60 * 1000) segs.push("new");
  if (c.lastOrderAt) {
    const lastMs = Date.now() - new Date(c.lastOrderAt).getTime();
    if (lastMs > 180 * 24 * 60 * 60 * 1000) segs.push("inactive");
    else if (c.orderCount > 0) segs.push("active");
  } else if (c.orderCount === 0) {
    segs.push("inactive");
  }
  return segs;
}

function segmentLabel(s: Segment): string {
  switch (s) {
    case "vip": return "VIP";
    case "high-value": return "High Value";
    case "active": return "Active";
    case "new": return "New";
    case "inactive": return "Inactive";
  }
}

function segmentTone(s: Segment): "success" | "warning" | "danger" | "neutral" | "accent" {
  switch (s) {
    case "vip": return "accent";
    case "high-value": return "success";
    case "active": return "success";
    case "new": return "neutral";
    case "inactive": return "warning";
  }
}

// ============================================
// HELPERS
// ============================================

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function relativeDate(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

type FilterType = "all" | "active" | "vip" | "high-value" | "new" | "inactive";

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminCustomersCRM() {
  const { token } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<CustomersResponse>("/admin/customers", { token });
      setData(res);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const customers = data?.customers ?? [];
    const needle = q.trim().toLowerCase();
    return customers.filter((c) => {
      if (needle && !c.name.toLowerCase().includes(needle) && !c.email.toLowerCase().includes(needle)) return false;
      if (filter === "all") return true;
      const segs = getSegments(c);
      if (filter === "active") return segs.includes("active");
      if (filter === "vip") return segs.includes("vip");
      if (filter === "high-value") return segs.includes("high-value");
      if (filter === "new") return segs.includes("new");
      if (filter === "inactive") return segs.includes("inactive");
      return true;
    }).sort((a, b) => {
      // Sort by last activity (most recent first)
      const at = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
      const bt = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
      return bt - at;
    });
  }, [data, q, filter]);

  const selectedCustomer = useMemo(() => {
    if (!selectedId) return null;
    return (data?.customers ?? []).find((c) => c._id === selectedId) ?? null;
  }, [data, selectedId]);

  // ============================================
  // LEFT PANEL — Customer List
  // ============================================
  const listPanel = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--admin-border)] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-sans text-lg font-bold text-[var(--admin-ink)]">Customers</h1>
            <p className="mt-0.5 font-sans text-xs text-[var(--admin-muted)]">
              {data?.summary.registered ?? 0} registered · {data?.summary.guestOnly ?? 0} guests
            </p>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading}
            className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-raised)] disabled:opacity-50" aria-label="Refresh">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} strokeWidth={1.75} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-faint)]" strokeWidth={1.75} />
          <AdminInput className="!mt-0 pl-9" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {/* Filter chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {([
            ["all", "All"],
            ["active", "Active"],
            ["vip", "VIP"],
            ["high-value", "High Value"],
            ["new", "New"],
            ["inactive", "Inactive"],
          ] as [FilterType, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                filter === key ? "bg-[var(--admin-ink)] text-white" : "border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-12 text-center text-xs text-[var(--admin-muted)]">Loading customers…</p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12">
            <AdminEmptyState title="No customers found" description="Try a different search or filter." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--admin-border)]">
            {filtered.map((c) => {
              const isActive = selectedId === c._id;
              const segs = getSegments(c);
              return (
                <button key={c._id} type="button" onClick={() => setSelectedId(c._id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                    isActive ? "bg-[var(--admin-accent-soft)] border-l-2 border-l-[var(--admin-accent)]" : "hover:bg-[var(--admin-surface-raised)]",
                  )}>
                  <AdminAvatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-sans text-sm font-medium text-[var(--admin-ink)]">{c.name}</p>
                      {segs.includes("vip") && <Crown className="h-3 w-3 shrink-0 text-amber-500" strokeWidth={2} />}
                    </div>
                    <p className="mt-0.5 truncate font-sans text-[11px] text-[var(--admin-faint)]">{c.email}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--admin-muted)]">
                      <span className="tabular-nums">{c.orderCount} orders</span>
                      <span>·</span>
                      <span className="tabular-nums font-medium">₹{c.totalSpent.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--admin-faint)]" strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // RIGHT PANEL — Customer Profile
  // ============================================
  const detailPanel = selectedCustomer ? (
    <CustomerProfile customer={selectedCustomer} onBack={() => setSelectedId(null)} />
  ) : (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Users className="mx-auto h-10 w-10 text-[var(--admin-faint)]" strokeWidth={1} />
        <p className="mt-3 font-sans text-sm text-[var(--admin-muted)]">Select a customer to view their profile</p>
      </div>
    </div>
  );

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-8" style={{ height: "calc(100vh - 60px)" }}>
      <AdminSplitView
        list={listPanel}
        detail={detailPanel}
        hasSelection={!!selectedCustomer}
        listWidth="w-[380px] min-w-[320px] max-w-[440px]"
      />
    </div>
  );
}

// ============================================
// CUSTOMER PROFILE COMPONENT
// ============================================

function CustomerProfile({ customer, onBack }: { customer: CustomerRow; onBack: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<ProfileTab>("orders");
  const segments = getSegments(customer);
  const aov = customer.orderCount > 0 ? Math.round(customer.totalSpent / customer.orderCount) : 0;

  function copyToClipboard(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Profile Header */}
      <div className="shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-5">
        <div className="flex items-start gap-4">
          <button type="button" onClick={onBack} className="mt-1 rounded-lg p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] lg:hidden" aria-label="Back">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <AdminAvatar name={customer.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-sans text-xl font-bold text-[var(--admin-ink)]">{customer.name}</h2>
              {segments.map((s) => (
                <AdminBadge key={s} tone={segmentTone(s)}>{segmentLabel(s)}</AdminBadge>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <button type="button" onClick={() => copyToClipboard(customer.email, "Email")}
                className="inline-flex items-center gap-1 font-sans text-sm text-[var(--admin-muted)] hover:text-[var(--admin-ink)]">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {customer.email}
                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" strokeWidth={1.75} />
              </button>
            </div>
            <p className="mt-1 font-sans text-xs text-[var(--admin-faint)]">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
          {/* Quick Actions */}
          <div className="hidden shrink-0 sm:flex gap-1.5">
            <button type="button" onClick={() => copyToClipboard(customer.email, "Email")}
              className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]" title="Copy email">
              <Mail className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <Link href="/admin/orders"
              className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-raised)] hover:text-[var(--admin-ink)]" title="View orders">
              <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* KPI Cards */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AdminCard padding="sm">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Lifetime Value</p>
              <p className="mt-1.5 font-sans text-lg font-bold tabular-nums text-[var(--admin-ink)]">₹{customer.totalSpent.toLocaleString("en-IN")}</p>
            </AdminCard>
            <AdminCard padding="sm">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Orders</p>
              <p className="mt-1.5 font-sans text-lg font-bold tabular-nums text-[var(--admin-ink)]">{customer.orderCount}</p>
            </AdminCard>
            <AdminCard padding="sm">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Avg. Order</p>
              <p className="mt-1.5 font-sans text-lg font-bold tabular-nums text-[var(--admin-ink)]">{aov > 0 ? `₹${aov.toLocaleString("en-IN")}` : "—"}</p>
            </AdminCard>
            <AdminCard padding="sm">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Last Purchase</p>
              <p className="mt-1.5 font-sans text-sm font-bold text-[var(--admin-ink)]">{relativeDate(customer.lastOrderAt)}</p>
            </AdminCard>
          </section>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[var(--admin-border)]">
            {([
              ["orders", "Orders", ShoppingBag],
              ["addresses", "Addresses", MapPin],
              ["timeline", "Timeline", Clock],
              ["notes", "Notes", StickyNote],
            ] as [ProfileTab, string, typeof ShoppingBag][]).map(([id, label, Icon]) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-sans text-xs font-semibold transition",
                  tab === id
                    ? "border-[var(--admin-ink)] text-[var(--admin-ink)]"
                    : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
                )}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "orders" && <OrdersTab customer={customer} />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "timeline" && <TimelineTab customer={customer} />}
          {tab === "notes" && <NotesTab customer={customer} />}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB: ORDERS
// ============================================

function OrdersTab({ customer }: { customer: CustomerRow }) {
  if (customer.orderCount === 0) {
    return <AdminEmptyState title="No orders yet" description="This customer hasn't placed any orders." />;
  }

  // We display summary info from the customer data — clicking goes to Orders page
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs text-[var(--admin-muted)]">{customer.orderCount} total orders</p>
        <Link href="/admin/orders" className="font-sans text-xs font-medium text-[var(--admin-accent)] hover:underline">
          View in Orders →
        </Link>
      </div>
      {/* Summary cards for recent activity */}
      <AdminCard padding="md">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <p className="font-sans text-sm text-[var(--admin-muted)]">Total spent</p>
            </div>
            <p className="font-sans text-sm font-semibold tabular-nums text-[var(--admin-ink)]">₹{customer.totalSpent.toLocaleString("en-IN")}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <p className="font-sans text-sm text-[var(--admin-muted)]">Order count</p>
            </div>
            <p className="font-sans text-sm font-semibold tabular-nums text-[var(--admin-ink)]">{customer.orderCount}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <p className="font-sans text-sm text-[var(--admin-muted)]">Last purchase</p>
            </div>
            <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">{formatDate(customer.lastOrderAt)}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
              <p className="font-sans text-sm text-[var(--admin-muted)]">Avg. order value</p>
            </div>
            <p className="font-sans text-sm font-semibold tabular-nums text-[var(--admin-ink)]">
              ₹{customer.orderCount > 0 ? Math.round(customer.totalSpent / customer.orderCount).toLocaleString("en-IN") : "0"}
            </p>
          </div>
        </div>
      </AdminCard>
      <p className="font-sans text-[11px] text-[var(--admin-faint)]">
        Open the Orders workspace to see detailed order history for this customer.
      </p>
    </div>
  );
}

// ============================================
// TAB: ADDRESSES
// ============================================

function AddressesTab() {
  // Addresses are not available from the /admin/customers endpoint
  // They would require a per-customer API call. Show placeholder.
  return (
    <AdminCard padding="md">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-[var(--admin-faint)]" strokeWidth={1.5} />
        <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-faint)]">Saved Addresses</h3>
      </div>
      <p className="font-sans text-sm text-[var(--admin-muted)]">
        Customer addresses are visible in their order shipping details. A dedicated address book API will enable this view.
      </p>
    </AdminCard>
  );
}

// ============================================
// TAB: TIMELINE
// ============================================

function TimelineTab({ customer }: { customer: CustomerRow }) {
  // Generate timeline from available data
  const events = useMemo(() => {
    const items: { id: string; icon: typeof User; text: string; date: string }[] = [];
    items.push({ id: "joined", icon: User, text: "Created account", date: customer.createdAt });
    if (customer.lastOrderAt) {
      items.push({ id: "last-order", icon: ShoppingBag, text: "Most recent order placed", date: customer.lastOrderAt });
    }
    // Sort most recent first
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [customer]);

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const Icon = event.icon;
        return (
          <div key={event.id} className="flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                idx === 0 ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]" : "bg-[var(--admin-surface-raised)] text-[var(--admin-faint)]",
              )}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              {idx < events.length - 1 && <div className="w-px flex-1 bg-[var(--admin-border)] mt-1" />}
            </div>
            <div className="min-w-0 flex-1 -mt-0.5">
              <p className="font-sans text-sm font-medium text-[var(--admin-ink)]">{event.text}</p>
              <p className="mt-0.5 font-sans text-[11px] text-[var(--admin-faint)]">
                {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        );
      })}
      {events.length === 0 && (
        <p className="font-sans text-sm text-[var(--admin-muted)]">No activity recorded yet.</p>
      )}
      <p className="mt-4 font-sans text-[11px] text-[var(--admin-faint)]">
        Full order-level timeline events are visible in the Order Operations Center.
      </p>
    </div>
  );
}

// ============================================
// TAB: NOTES (Local placeholder)
// ============================================

function NotesTab({ customer }: { customer: CustomerRow }) {
  const [notes, setNotes] = useState<{ id: string; text: string; date: string }[]>([]);
  const [draft, setDraft] = useState("");

  function addNote() {
    if (!draft.trim()) return;
    setNotes((prev) => [
      { id: `note-${Date.now()}`, text: draft.trim(), date: new Date().toISOString() },
      ...prev,
    ]);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div className="space-y-2">
        <textarea
          className="admin-input w-full min-h-[80px]"
          placeholder="Add a note about this customer…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <AdminButton variant="primary" size="sm" onClick={addNote} disabled={!draft.trim()}>
          <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} /> Add note
        </AdminButton>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="font-sans text-sm text-[var(--admin-muted)]">
          No notes yet. Add internal notes about this customer — visible to admins only.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <AdminCard key={note.id} padding="sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-sans text-sm text-[var(--admin-ink)] whitespace-pre-wrap">{note.text}</p>
                <button type="button" className="shrink-0 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setNotes((prev) => prev.filter((n) => n.id !== note.id))}>
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
              <p className="mt-1.5 font-sans text-[10px] text-[var(--admin-faint)]">
                Admin · {new Date(note.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </AdminCard>
          ))}
        </div>
      )}

      <p className="font-sans text-[10px] text-[var(--admin-faint)] italic">
        Notes are stored locally in this session. A backend notes API will persist them permanently.
      </p>
    </div>
  );
}
