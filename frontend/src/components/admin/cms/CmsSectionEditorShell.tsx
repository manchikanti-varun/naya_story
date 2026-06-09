"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { useCmsEditorContext } from "@/components/admin/cms/CmsEditorContext";
import { CmsEditorSaveActions } from "@/components/admin/cms/CmsEditorSaveActions";
import { cn } from "@/lib/cn";

export type CmsEditorTab = "content" | "design" | "layout" | "seo" | "responsive" | "advanced";

const TAB_LABELS: Record<CmsEditorTab, string> = {
  content: "Content",
  design: "Design",
  layout: "Layout",
  seo: "SEO",
  responsive: "Responsive",
  advanced: "Advanced",
};

type TabConfig = {
  id: CmsEditorTab;
  label?: string;
  content: ReactNode;
  disabled?: boolean;
  hint?: string;
};

type Props = {
  title: string;
  description?: string;
  sectionId?: string;
  previewHref?: string;
  storefrontHref?: string;
  tabs: TabConfig[];
  defaultTab?: CmsEditorTab;
};

export function CmsSectionEditorShell({
  title,
  description,
  sectionId,
  previewHref,
  storefrontHref = "/",
  tabs,
  defaultTab = "content",
}: Props) {
  const { compact } = useCmsEditorContext();
  const enabledTabs = tabs.filter((t) => !t.disabled);
  const [active, setActive] = useState<CmsEditorTab>(
    enabledTabs.some((t) => t.id === defaultTab) ? defaultTab : enabledTabs[0]?.id ?? "content",
  );

  const activeTab = enabledTabs.find((t) => t.id === active) ?? enabledTabs[0];
  const showTabs = enabledTabs.length > 1;

  return (
    <article
      id={sectionId}
      className={cn(
        compact ? "admin-cms-shell-compact" : "admin-surface-elevated overflow-hidden rounded-[var(--admin-radius)]",
      )}
    >
      {!compact ? (
        <header className="border-b border-[var(--admin-border)] px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="font-sans text-xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-2xl">
                {title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[var(--admin-muted)]">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
            {previewHref ? (
              <Link href={previewHref} className="admin-action-link">
                <Eye className="h-3.5 w-3.5" strokeWidth={1.65} />
                Preview
              </Link>
            ) : null}
            <Link href={storefrontHref} target="_blank" className="admin-action-link admin-action-link--muted">
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.65} />
              Live store
            </Link>
            </div>
          </div>
          <div className="mt-5 border-t border-[var(--admin-border)] pt-5">
            <CmsEditorSaveActions compact showPreviewLink={Boolean(previewHref)} />
          </div>
        </header>
      ) : null}

      {showTabs ? (
        <div className={cn("admin-cms-tabs-wrap", compact ? "" : "border-b border-[var(--admin-border)] px-4 sm:px-6")}>
          <div className="admin-cms-tabs py-2">
            {enabledTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-active={active === tab.id}
                onClick={() => setActive(tab.id)}
                className="admin-cms-tab"
              >
                {tab.label ?? TAB_LABELS[tab.id]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={cn("admin-cms-tab-body", compact ? "pt-5" : "p-6 sm:p-8")}>
        {activeTab?.hint ? (
          <p className="mb-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-4 py-3 font-sans text-xs text-[var(--admin-muted)]">
            {activeTab.hint}
          </p>
        ) : null}
        {activeTab?.content}
      </div>
    </article>
  );
}
