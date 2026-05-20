"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTabs } from "@/components/admin/ui/AdminTabs";
import { UnifiedHomepageBuilder } from "@/components/admin/website/UnifiedHomepageBuilder";
import {
  ContentEditorCollectionsPanel,
  ContentEditorNewInPagePanel,
  ContentEditorOurStoryPanel,
} from "@/components/admin/homepage-editor/panels";
import {
  normalizePagesTab,
  websitePagesUrl,
  type WebsitePagesTab,
} from "@/lib/admin/website-pages";

const TABS: { id: WebsitePagesTab; label: string }[] = [
  { id: "homepage", label: "Homepage" },
  { id: "collections-browse", label: "Collections browse" },
  { id: "new-in", label: "New In page" },
  { id: "our-story", label: "Our Story" },
];

function PagesEditor() {
  const searchParams = useSearchParams();
  const tab = normalizePagesTab(searchParams.get("tab"));

  const description =
    tab === "homepage"
      ? "Visual section builder for the storefront home — reorder, edit, and publish sections."
      : "Store routes — collections browse, New In, and Our Story.";

  return (
    <AdminPageLayout
      eyebrow="Website"
      title="Pages"
      maxWidthClass="max-w-4xl"
      description={description}
      actions={
        tab === "homepage" ? (
          <>
            <Link href="/admin/content/preview/hero" className="admin-action-link">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.65} />
              Preview
            </Link>
            <Link href="/" target="_blank" className="admin-action-link admin-action-link--muted">
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.65} />
              Live store
            </Link>
          </>
        ) : undefined
      }
    >
      <AdminTabs
        tabs={TABS.map((t) => ({ id: t.id, label: t.label, href: websitePagesUrl(t.id) }))}
        activeId={tab}
      />

      {tab === "homepage" ? (
        <div className="mt-6">
          <UnifiedHomepageBuilder embedded />
        </div>
      ) : (
        <AdminCard elevated padding="none" className="mt-6 overflow-hidden">
          {tab === "collections-browse" ? <ContentEditorCollectionsPanel embedded /> : null}
          {tab === "new-in" ? <ContentEditorNewInPagePanel embedded /> : null}
          {tab === "our-story" ? <ContentEditorOurStoryPanel embedded /> : null}
        </AdminCard>
      )}
    </AdminPageLayout>
  );
}

export default function WebsitePagesPage() {
  return (
    <Suspense fallback={<p className="font-sans text-sm text-[var(--admin-muted)]">Loading…</p>}>
      <PagesEditor />
    </Suspense>
  );
}
