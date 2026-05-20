import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export default function OrdersShippingPage() {
  return (
    <AdminPlaceholder
      title="Shipping"
      description="Carrier profiles, SLA cut-offs, and packaging presets will live here. Today, capture tracking numbers inline on the orders board — updates publish to shoppers on refresh."
      docsHref="/admin/orders"
      docsLabel="Orders board"
    />
  );
}
