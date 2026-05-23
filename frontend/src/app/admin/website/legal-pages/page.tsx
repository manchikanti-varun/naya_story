import { LegalPagesManager } from "@/components/admin/LegalPagesManager";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

export default function WebsiteLegalPagesPage() {
  return (
    <AdminPageLayout
      title="Legal pages"
      description="Terms, privacy, refunds, shipping — or any policy page. Each gets its own route and footer link."
    >
      <LegalPagesManager />
    </AdminPageLayout>
  );
}
