import type { ReactNode } from "react";
import Link from "next/link";
import { ImageIcon, Link2, Server } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

function InfoBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Server;
  title: string;
  children: ReactNode;
}) {
  return (
    <AdminCard elevated padding="md">
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
          <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-sans text-base font-semibold text-[var(--admin-ink)]">{title}</h2>
          <div className="mt-2 font-sans text-sm leading-relaxed text-[var(--admin-muted)]">{children}</div>
        </div>
      </div>
    </AdminCard>
  );
}

export default function AdminEnvironmentPage() {
  return (
    <AdminPageLayout
      eyebrow="System"
      title="Environment"
      maxWidthClass="max-w-2xl"
      description={
        <>
          This page is <strong className="font-medium text-[var(--admin-ink)]">not</strong> where you change shipping
          rules, tax, or store policies. It only shows{" "}
          <strong className="font-medium text-[var(--admin-ink)]">technical readouts</strong> so developers and
          operators can confirm which API this browser build is talking to.
        </>
      }
    >
      <InfoBlock icon={Server} title="Backend API base URL">
        <p>
          All admin and storefront data requests use this origin. To point at staging or production, set{" "}
          <code className="rounded bg-[var(--admin-surface-raised)] px-1.5 py-0.5 font-mono text-xs text-[var(--admin-ink)]">
            NEXT_PUBLIC_API_URL
          </code>{" "}
          in your deployment environment (for example Vercel project settings), then redeploy the frontend.
        </p>
        <p className="mt-4 break-all rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-3 py-2 font-mono text-sm text-[var(--admin-ink)]">
          {API_BASE}
        </p>
      </InfoBlock>

      <InfoBlock icon={Link2} title="Why you might open this page">
        <ul className="list-disc space-y-2 pl-5">
          <li>Verify the admin panel is not accidentally hitting localhost while the shop is in production.</li>
          <li>Share a screenshot with engineering when debugging &quot;data not updating&quot; issues.</li>
        </ul>
      </InfoBlock>

      <InfoBlock icon={ImageIcon} title="Images & media">
        <p>
          Upload images from{" "}
          <Link href="/admin/media" className="admin-link font-medium">
            Media
          </Link>{" "}
          (stored in Cloudinary when API keys are set) or paste HTTPS URLs into products and CMS
          fields.
        </p>
      </InfoBlock>
    </AdminPageLayout>
  );
}
