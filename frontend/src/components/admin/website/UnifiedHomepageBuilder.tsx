"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { CmsEditorProvider } from "@/components/admin/cms/CmsEditorContext";
import { CmsEditorSaveActions } from "@/components/admin/cms/CmsEditorSaveActions";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { AdminSection } from "@/components/admin/ui/AdminSection";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminInlineLoading } from "@/components/admin/ui/AdminLoader";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { renderHomepageSectionEditor } from "@/lib/admin/section-editor-registry";
import { homepageSectionEditUrl, resolveHomepageEditSection } from "@/lib/admin/homepage-edit";
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

  const rawEdit = searchParams.get("edit");
  const editSection = resolveHomepageEditSection(rawEdit);

  useEffect(() => {
    if (!rawEdit || !editSection || rawEdit === editSection) return;
    router.replace(homepageSectionEditUrl(editSection), { scroll: false });
  }, [rawEdit, editSection, router]);

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
    return <AdminInlineLoading label="Loading homepage…" />;
  }

  const storefrontBlocks = getOrderedStorefrontBlocks(hp);
  const drawerMeta = editSection ? getSectionMeta(editSection) : null;

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
    if (!editSection) return null;
    return renderHomepageSectionEditor(editSection);
  }, [editSection]);

  const body = (
    <>
      <AdminSection title="Sections" description="Edit a section, drag to reorder, or turn off to hide on the shop.">
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
                onEdit={() => openEdit(b.type)}
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
    </>
  );

  return (
    <>
      {embedded ? (
        body
      ) : (
        <AdminPageLayout
          title="Homepage"
          maxWidthClass="max-w-4xl"
          description="Edit sections and publish when ready."
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
        open={Boolean(editSection && drawerContent)}
        onClose={closeDrawer}
        title={drawerMeta?.label ?? "Edit section"}
        description={drawerMeta?.description}
        size={editSection === "hero" ? "xl" : "lg"}
        footer={
          <CmsEditorSaveActions compact actionsOnly />
        }
      >
        <CmsEditorProvider compact>
          <div key={editSection ?? "none"}>{drawerContent}</div>
        </CmsEditorProvider>
      </AdminDrawer>
    </>
  );
}
