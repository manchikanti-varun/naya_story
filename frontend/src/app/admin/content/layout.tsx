import type { ReactNode } from "react";
import { ContentEditorShell } from "@/components/admin/homepage-editor/ContentEditorShell";

export default function AdminContentLayout({ children }: { children: ReactNode }) {
  return <ContentEditorShell>{children}</ContentEditorShell>;
}
