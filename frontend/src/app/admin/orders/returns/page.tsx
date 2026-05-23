import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminCard } from "@/components/admin/ui/AdminCard";

export default function AdminReturnsPage() {
  return (
    <AdminPageLayout
      title="Returns & exchanges"
      maxWidthClass="max-w-2xl"
      description="Operational hub for post-purchase workflows. Full RMA automation can plug in here (carrier labels, restock, partial refunds)."
    >
      <AdminCard padding="lg" className="border-dashed">
        <Package className="h-8 w-8 text-[var(--admin-accent)]" strokeWidth={1.25} aria-hidden />
        <p className="mt-4 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          Returns intake, eligibility rules, and refund orchestration are not yet wired to a dedicated workflow in
          this build. Use <strong className="text-[var(--admin-ink)]">All orders</strong> to look up a customer
          order, then process refunds through your payment provider dashboard when needed.
        </p>
        <Link
          href="/admin/orders"
          className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-medium text-[var(--admin-accent)] hover:underline"
        >
          Open orders
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </Link>
      </AdminCard>
    </AdminPageLayout>
  );
}
