import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent" | "info";

const tones: Record<Tone, string> = {
  neutral: "admin-badge--neutral",
  success: "admin-badge--success",
  warning: "admin-badge--warning",
  danger: "admin-badge--danger",
  accent: "admin-badge--accent",
  info: "admin-badge--info",
};

export function AdminBadge({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  /** Show a status dot before the text */
  dot?: boolean;
}) {
  return (
    <span className={cn("admin-badge", tones[tone], dot && "admin-badge--dot", className)}>
      {children}
    </span>
  );
}
