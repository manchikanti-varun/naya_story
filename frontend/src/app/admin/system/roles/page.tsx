import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export default function SystemRolesPage() {
  return (
    <AdminPlaceholder
      title="Roles & permissions"
      description="Granular admin roles (catalog, CMS, finance) will be configurable here. All authenticated admins have full access today."
      docsHref="/admin/settings"
      docsLabel="Environment"
    />
  );
}
