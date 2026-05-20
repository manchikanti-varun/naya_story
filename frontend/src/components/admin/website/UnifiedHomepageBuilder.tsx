"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Sparkles } from "lucide-react";
import {
  buildLayoutBlocksFromHomepage,
  getOrderedStorefrontBlocks,
  mergeLayoutBlocksIntoHomepageClient,
  reorderHomepageStorefrontBlocks,
} from "@/lib/homepage-layout-blocks";
import { getSectionMeta } from "@/lib/cms/section-meta";
import { CmsBlockCard } from "@/components/admin/cms/CmsBlockCard";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminSection } from "@/components/admin/ui/AdminSection";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import {
  isEditableHomepageBlock,
  renderHomepageSectionEditor,
} from "@/lib/admin/section-editor-registry";
import type { HomepageLayoutBlockType, HomepageStorefrontBlockType } from "@/types/homepage";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

function blockThumbnail(hp: NonNullable<ReturnType<typeof useHomepageEditor>["hp"]>, type: HomepageLayoutBlockType) {
  if (type === "hero") {
    const slide = hp.carousel.slides.find((s) => s.enabled && s.desktopImage);
    return slide?.desktopImage ?? null;
  }
  if (type === "brandStory") return hp.editorial?.brandStory.image ?? null;
  if (type === "craftsmanship") return hp.editorial?.craftsmanship.image ?? null;
  return null;
}

export function UnifiedHomepageBuilder({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hp, setHp, moveStorefrontBlock } = useHomepageEditor();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const editParam = searchParams.get("edit") as HomepageLayoutBlockType | null;

  const closeDrawer = useCallback(() => {
    router.replace("/admin/website/pages?tab=homepage", { scroll: false });
  }, [router]);

  const openEdit = useCallback(
    (type: HomepageLayoutBlockType) => {
      router.replace(`/admin/website/pages?tab=homepage&edit=${type}`, { scroll: false });
    },
    [router],
  );

  if (!hp) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading homepage…</p>;
  }

  const storefrontBlocks = getOrderedStorefrontBlocks(hp);
  const drawerMeta = editParam ? getSectionMeta(editParam) : null;

  const toggleBlock = (id: string) => {
    setHp((prev) => {
      if (!prev) return prev;
      const base = prev.layoutBlocks?.length ? prev.layoutBlocks : buildLayoutBlocksFromHomepage(prev);
      const next = base.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b));
      return mergeLayoutBlocksIntoHomepageClient(prev, next);
    });
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return;
    setHp((prev) => (prev ? reorderHomepageStorefrontBlocks(prev, dragIndex, toIndex) : prev));
    setDragIndex(null);
    setOverIndex(null);
  };

  const drawerContent = useMemo(() => {
    if (!editParam || !isEditableHomepageBlock(editParam)) return null;
    return renderHomepageSectionEditor(editParam);
  }, [editParam]);

  const body = (
    <>
      <AdminSection
        title="Homepage sections"
        description="Drag a section or use arrows to reorder. Click Edit for content, design, and layout tabs."
      >
        <ol className="space-y-3">
          {storefrontBlocks.map((b, sfIdx) => {
            const meta = getSectionMeta(b.type);
            const type = b.type as HomepageStorefrontBlockType;
            return (
              <CmsBlockCard
                key={b.id}
                title={meta.label}
                description={meta.description}
                enabled={b.enabled}
                thumbnailUrl={blockThumbnail(hp, b.type)}
                canToggle
                canReorder
                draggable
                isDragOver={overIndex === sfIdx}
                onToggle={() => toggleBlock(b.id)}
                onMoveUp={sfIdx > 0 ? () => moveStorefrontBlock(type, -1) : undefined}
                onMoveDown={
                  sfIdx < storefrontBlocks.length - 1 ? () => moveStorefrontBlock(type, 1) : undefined
                }
                onEdit={isEditableHomepageBlock(b.type) ? () => openEdit(b.type) : undefined}
                onDragStart={() => setDragIndex(sfIdx)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(sfIdx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(sfIdx);
                }}
                previewHref={meta.previewSlug ? `/admin/content/preview/${meta.previewSlug}` : undefined}
                orderLabel={`#${sfIdx + 1}`}
              />
            );
          })}
        </ol>
      </AdminSection>

      <AdminCard elevated padding="md" className="border-[var(--admin-accent)]/15 bg-[var(--admin-accent-soft)]/30">
        <p className="font-sans text-sm text-[var(--admin-ink)]">
          <span className="font-semibold">Workflow:</span> reorder here → Edit a section → adjust Content & Design
          tabs → <span className="font-semibold">Save changes</span> in the bar below. Announcement bar and footer are
          under <span className="font-semibold">Website → Announcement bar</span> and{" "}
          <span className="font-semibold">Website → Footer</span>. Use{" "}
          <kbd className="rounded border border-[var(--admin-border)] bg-[var(--admin-surface)] px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>{" "}
          to jump anywhere in admin.
        </p>
      </AdminCard>
    </>
  );

  return (
    <>
      {embedded ? (
        body
      ) : (
        <AdminPageLayout
          eyebrow="Website"
          title="Homepage"
          maxWidthClass="max-w-4xl"
          description="Reorder sections, toggle visibility, and edit content and design. Save draft stores your work; Publish live updates the public storefront when you are ready."
          actions={
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
          }
        >
          {body}
        </AdminPageLayout>
      )}

      <AdminDrawer
        open={Boolean(editParam && drawerContent)}
        onClose={closeDrawer}
        title={drawerMeta?.label ?? "Edit section"}
        description={drawerMeta?.description}
        size={editParam === "hero" ? "xl" : "lg"}
      >
        {drawerContent}
      </AdminDrawer>
    </>
  );
}
