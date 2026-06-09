import { ContentEditorThemePanel } from "@/components/admin/homepage-editor/ThemePanel";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

export default function WebsiteThemePage() {
  return (
    <AdminPageLayout
      title="Theme Studio"
      description="Brand colors applied across the storefront."
    >
      <ContentEditorThemePanel />
    </AdminPageLayout>
  );
}
