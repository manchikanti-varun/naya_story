import { AdminShell } from "@/components/admin/AdminShell";
import "./admin-theme.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-app min-h-screen">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
