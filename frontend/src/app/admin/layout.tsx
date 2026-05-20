import { AdminShell } from "@/components/admin/AdminShell";
import { STORE_LOGO_PUBLIC_PATH } from "@/lib/constants";
import { bustLogoPath, getLogoCacheRev } from "@/lib/logo-cache";
import "./admin-theme.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const logoSrc = bustLogoPath(STORE_LOGO_PUBLIC_PATH, getLogoCacheRev());

  return (
    <div className="admin-app min-h-screen">
      <AdminShell logoSrc={logoSrc}>{children}</AdminShell>
    </div>
  );
}
