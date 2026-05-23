import { StorefrontProductPagePanel } from "@/components/admin/website/StorefrontProductPagePanel";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

export default function WebsiteProductPageSettings() {
  return (
    <AdminPageLayout
      title="Product page"
      description="Suggested products rail on every product detail page."
      maxWidthClass="max-w-4xl"
    >
      <StorefrontProductPagePanel />
    </AdminPageLayout>
  );
}
