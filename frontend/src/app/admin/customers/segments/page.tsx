import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export default function CustomersSegmentsPage() {
  return (
    <AdminPlaceholder
      title="Segments"
      description="Cohort builder (RFM, geography, lifetime value) will power campaigns and private collections. Export customer lists from the directory until automation ships."
      docsHref="/admin/customers"
      docsLabel="Customer list"
    />
  );
}
