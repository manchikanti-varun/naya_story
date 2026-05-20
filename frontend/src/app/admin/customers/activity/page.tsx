import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export default function CustomersActivityPage() {
  return (
    <AdminPlaceholder
      title="Activity log"
      description="A unified timeline of sign-ins, orders, and support notes will appear here. Use the customer directory and orders board for now."
      docsHref="/admin/customers"
      docsLabel="Customer list"
    />
  );
}
