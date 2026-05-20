"use client";

import {
  buildLayoutBlocksFromHomepage,
  deriveHomepageLayoutBlocks,
  getOrderedStorefrontBlocks,
  isHomepageStorefrontBlockType,
  mergeLayoutBlocksIntoHomepageClient,
} from "@/lib/homepage-layout-blocks";
import { getSectionMeta } from "@/lib/cms/section-meta";
import { CmsBlockCard } from "@/components/admin/cms/CmsBlockCard";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import type { HomepageLayoutBlockType, HomepageStorefrontBlockType } from "@/types/homepage";

const PINNED_TYPES = new Set<HomepageLayoutBlockType>(["promoBar", "theme", "footer"]);

const TOGGLE_TYPES = new Set<HomepageLayoutBlockType>([
  "promoBar",
  "hero",
  "brandStory",
  "bestsellers",
  "lookbook",
  "newIn",
  "craftsmanship",
  "categories",
  "asSeenIn",
  "editorialJournal",
  "luxuryPromise",
  "instagramGallery",
  "newsletter",
]);

type Props = {
  showGlobalChrome?: boolean;
};

export function HomepageLayoutSectionList({ showGlobalChrome = true }: Props) {
  const { hp, setHp, moveStorefrontBlock } = useHomepageEditor();
  if (!hp) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading layout…</p>;
  }

  const blocks = deriveHomepageLayoutBlocks(hp);
  const storefrontBlocks = getOrderedStorefrontBlocks(hp);

  const toggleBlock = (id: string) => {
    setHp((prev) => {
      if (!prev) return prev;
      const base = prev.layoutBlocks?.length ? prev.layoutBlocks : buildLayoutBlocksFromHomepage(prev);
      const next = base.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b));
      return mergeLayoutBlocksIntoHomepageClient(prev, next);
    });
  };

  const visibleBlocks = showGlobalChrome
    ? blocks
    : blocks.filter((b) => !PINNED_TYPES.has(b.type));

  return (
    <ol className="space-y-3">
      {visibleBlocks.map((b) => {
        const meta = getSectionMeta(b.type);
        const sfIdx = storefrontBlocks.findIndex((x) => x.id === b.id);
        const canReorder = isHomepageStorefrontBlockType(b.type) && sfIdx >= 0;
        const canToggle = TOGGLE_TYPES.has(b.type);
        const previewSlug = meta.previewSlug;

        return (
          <CmsBlockCard
            key={b.id}
            title={meta.label}
            description={meta.description}
            enabled={b.enabled}
            canToggle={canToggle}
            canReorder={canReorder}
            onToggle={canToggle ? () => toggleBlock(b.id) : undefined}
            onMoveUp={
              canReorder && sfIdx > 0
                ? () =>
                    moveStorefrontBlock(storefrontBlocks[sfIdx]!.type as HomepageStorefrontBlockType, -1)
                : undefined
            }
            onMoveDown={
              canReorder && sfIdx >= 0 && sfIdx < storefrontBlocks.length - 1
                ? () =>
                    moveStorefrontBlock(storefrontBlocks[sfIdx]!.type as HomepageStorefrontBlockType, 1)
                : undefined
            }
            editHref={meta.editHref}
            previewHref={previewSlug ? `/admin/content/preview/${previewSlug}` : undefined}
            orderLabel={canReorder ? `#${sfIdx + 1}` : undefined}
          />
        );
      })}
    </ol>
  );
}
