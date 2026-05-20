import { ContentEditorFooterPanel } from "@/components/admin/homepage-editor/panels";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

export default function WebsiteFooterPage() {
  return (
    <AdminPageLayout
      eyebrow="Website"
      title="Footer"
      description="Site-wide footer — links, contact, social, and copyright."
    >
      <ContentEditorFooterPanel />
    </AdminPageLayout>
  );
}
