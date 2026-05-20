import type { ReactNode } from "react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidthClass?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
};

/** @deprecated Use AdminPageLayout — kept for backward compatibility. */
export function AdminPageShell({
  eyebrow,
  title,
  description,
  children,
  className,
  maxWidthClass,
  actions,
  toolbar,
}: Props) {
  return (
    <AdminPageLayout
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={actions}
      toolbar={toolbar}
      className={className}
      maxWidthClass={maxWidthClass}
    >
      {children}
    </AdminPageLayout>
  );
}
