import { ContentEditorThemePanel } from "@/components/admin/homepage-editor/ThemePanel";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

export default function WebsiteThemePage() {
  return (
    <AdminPageLayout
      title="Theme Studio"
      description="Global brand colors map to CSS variables on the public site. Section-level design overrides live in each homepage section under Design."
    >
      <ContentEditorThemePanel />
    </AdminPageLayout>
  );
}
