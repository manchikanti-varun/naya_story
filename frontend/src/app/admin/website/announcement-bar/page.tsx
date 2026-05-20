import { ContentEditorTopPromoPanel } from "@/components/admin/homepage-editor/TopPromoPanel";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

export default function WebsiteAnnouncementBarPage() {
  return (
    <AdminPageLayout
      eyebrow="Website"
      title="Announcement bar"
      description="Thin strip above the main navigation — shipping notes, launches, or editorial moments."
    >
      <ContentEditorTopPromoPanel />
    </AdminPageLayout>
  );
}
