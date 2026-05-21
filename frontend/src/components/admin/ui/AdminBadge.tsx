import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const tones: Record<Tone, string> = {
  neutral: "admin-badge--neutral",
  success: "admin-badge--success",
  warning: "admin-badge--warning",
  danger: "admin-badge--danger",
  accent: "admin-badge--accent",
};

export function AdminBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={cn("admin-badge", tones[tone], className)}>
      {children}
    </span>
  );
}
