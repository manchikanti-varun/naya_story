"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, Globe, Layers, Sparkles } from "lucide-react";
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
  { id: "collections-browse", label: "Collections" },
  { id: "new-in", label: "New In" },
  { id: "our-story", label: "Our Story" },
];

const TAB_DESCRIPTIONS: Record<WebsitePagesTab, { title: string; description: string }> = {
  homepage: {
    title: "Homepage Builder",
    description: "Edit sections, reorder content, and publish changes to your storefront.",
  },
  "collections-browse": {
    title: "Collections Page",
    description: "Configure the collections browse page — filters, layout, and category tabs.",
  },
  "new-in": {
    title: "New In Page",
    description: "Manage the New In landing page — curate featured new arrivals.",
  },
  "our-story": {
    title: "Our Story",
    description: "Edit your brand story page — narrative, images, and sections.",
  },
};

function PagesEditor() {
  const searchParams = useSearchParams();
  const tab = normalizePagesTab(searchParams.get("tab"));
  const { title, description } = TAB_DESCRIPTIONS[tab];

  return (
    <AdminPageLayout
      title={title}
      maxWidthClass="max-w-4xl"
      description={description}
      actions={
        <div className="flex items-center gap-2">
          {tab === "homepage" ? (
            <Link href="/admin/content/preview/hero" className="admin-btn admin-btn--secondary admin-btn--sm">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.65} />
              Preview
            </Link>
          ) : null}
          <Link href="/" target="_blank" className="admin-btn admin-btn--ghost admin-btn--sm">
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.65} />
            Live store
          </Link>
        </div>
      }
    >
      {/* Tab navigation */}
      <AdminTabs
        tabs={TABS.map((t) => ({ id: t.id, label: t.label, href: websitePagesUrl(t.id) }))}
        activeId={tab}
      />

      {/* Tab content */}
      <div className="mt-6">
        {tab === "homepage" ? (
          <UnifiedHomepageBuilder embedded />
        ) : (
          <AdminCard padding="none" className="overflow-hidden">
            {tab === "collections-browse" ? <ContentEditorCollectionsPanel embedded /> : null}
            {tab === "new-in" ? <ContentEditorNewInPagePanel embedded /> : null}
            {tab === "our-story" ? <ContentEditorOurStoryPanel embedded /> : null}
          </AdminCard>
        )}
      </div>
    </AdminPageLayout>
  );
}

export default function WebsitePagesPage() {
  return (
    <Suspense fallback={<p className="p-8 font-sans text-sm text-[var(--admin-muted)]">Loading pages…</p>}>
      <PagesEditor />
    </Suspense>
  );
}
