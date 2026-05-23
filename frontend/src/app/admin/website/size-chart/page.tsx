import { GlobalSizeChartPanel } from "@/components/admin/website/GlobalSizeChartPanel";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

export default function WebsiteSizeChartPage() {
  return (
    <AdminPageLayout
      title="Size chart"
      description="Global fit guide used on every product page and anywhere SIZE CHART is shown on the storefront."
      maxWidthClass="max-w-4xl"
    >
      <GlobalSizeChartPanel />
    </AdminPageLayout>
  );
}
