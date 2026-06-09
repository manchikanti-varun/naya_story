import { GlobalSizeChartPanel } from "@/components/admin/website/GlobalSizeChartPanel";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

export default function WebsiteSizeChartPage() {
  return (
    <AdminPageLayout
      title="Size chart"
      description="Global size guide shown on product pages."
      maxWidthClass="max-w-4xl"
    >
      <GlobalSizeChartPanel />
    </AdminPageLayout>
  );
}
