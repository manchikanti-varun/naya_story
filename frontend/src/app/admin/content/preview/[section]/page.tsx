"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { renderPreviewSection } from "@/components/admin/homepage-editor/preview/PreviewPanels";
import { isPreviewSectionSlug } from "@/components/admin/homepage-editor/preview/PreviewSectionNav";
import { useHomepageEditor } from "@/components/admin/homepage-editor/context";

export default function AdminContentPreviewSectionPage() {
  const params = useParams();
  const router = useRouter();
  const raw = params.section;
  const section = Array.isArray(raw) ? raw[0] : raw;
  const { hp } = useHomepageEditor();

  useEffect(() => {
    if (!section || !isPreviewSectionSlug(section)) {
      router.replace("/admin/content/preview/hero");
    }
  }, [section, router]);

  if (!section || !isPreviewSectionSlug(section)) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (!hp) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return <div className="min-h-[40vh]">{renderPreviewSection(section, hp)}</div>;
}
