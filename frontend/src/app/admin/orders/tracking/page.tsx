import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export default function OrdersTrackingPage() {
  return (
    <AdminPlaceholder
      title="Tracking"
      description="Bulk AWB import and carrier webhooks will land here. Paste tracking per order on the orders board until automation ships."
      docsHref="/admin/orders"
      docsLabel="Orders board"
    />
  );
}
