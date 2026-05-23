import Link from "next/link";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

type Props = {
  title: string;
  description: string;
  docsHref?: string;
  docsLabel?: string;
};

export function AdminPlaceholder({ title, description, docsHref, docsLabel = "Open related area" }: Props) {
  return (
    <AdminPageLayout title={title} description={description} maxWidthClass="max-w-2xl">
      <AdminCard elevated>
        <p className="font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
          This surface is reserved for a future release. Your catalog, orders, and storefront CMS continue to work
          as today — we are standardizing admin UX before adding deeper automation here.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {docsHref ? (
            <Link href={docsHref}>
              <AdminButton variant="secondary" size="sm">
                {docsLabel}
              </AdminButton>
            </Link>
          ) : null}
          <Link href="/admin">
            <AdminButton variant="ghost" size="sm">
              Dashboard
            </AdminButton>
          </Link>
        </div>
      </AdminCard>
    </AdminPageLayout>
  );
}
