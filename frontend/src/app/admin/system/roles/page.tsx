import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

const roles = [
  {
    role: "Super admin",
    scope: "Full platform",
    capabilities: "Catalog, CMS, orders, customers, coupons, analytics, system settings, user roles.",
  },
  {
    role: "Content manager",
    scope: "Storefront CMS",
    capabilities: "Homepage, collections copy, Our Story, footer, newsletter, promo bar, theme colors, media picks.",
  },
  {
    role: "Commerce lead",
    scope: "Merchandising",
    capabilities: "Products, inventory signals, collections merchandising, featured placements, pricing experiments.",
  },
  {
    role: "Operations",
    scope: "Fulfilment",
    capabilities: "Orders, statuses, tracking numbers, shipping escalations (future carrier integrations).",
  },
  {
    role: "Support",
    scope: "Read-mostly",
    capabilities: "Customer lookup, order history, read catalog — no destructive catalog or CMS actions.",
  },
];

export default function SystemRolesPage() {
  return (
    <AdminPageShell
      eyebrow="System"
      title="Roles & permissions"
      maxWidthClass="max-w-4xl"
      description={
        <>
          Naya currently authenticates <strong className="text-[var(--admin-ink)]">administrators</strong> as a single
          role. The matrix below is the target model for granular policies when the backend policy engine ships.
        </>
      }
    >
      <div className="admin-surface overflow-hidden rounded-2xl">
        <table className="min-w-full divide-y divide-[var(--admin-border)] text-left text-sm">
          <thead className="bg-[var(--admin-surface-raised)] font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-faint)]">
            <tr>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Scope</th>
              <th className="px-5 py-3">Capabilities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)] text-[var(--admin-muted)]">
            {roles.map((r) => (
              <tr key={r.role}>
                <td className="px-5 py-4 font-medium text-[var(--admin-ink)]">{r.role}</td>
                <td className="px-5 py-4">{r.scope}</td>
                <td className="px-5 py-4 leading-relaxed">{r.capabilities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-sans text-sm text-[var(--admin-muted)]">
        Today: sign in as admin to access everything. Next: map JWT claims to the rows above and gate PATCH routes per
        resource.
      </p>
      <Link href="/admin/settings" className="font-sans text-sm font-medium text-[var(--admin-accent)] underline-offset-4 hover:underline">
        Environment settings →
      </Link>
    </AdminPageShell>
  );
}
