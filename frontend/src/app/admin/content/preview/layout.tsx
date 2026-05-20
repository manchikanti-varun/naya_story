"use client";

import type { ReactNode } from "react";
import { PreviewSectionNav } from "@/components/admin/homepage-editor/preview/PreviewSectionNav";
import { PreviewToolbar } from "@/components/admin/homepage-editor/preview/PreviewToolbar";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";

export default function PreviewLayout({ children }: { children: ReactNode }) {
  const { hp, msg } = useHomepageEditor();

  if (!hp) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <PreviewToolbar />
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
      <PreviewSectionNav />
      {children}
    </div>
  );
}
