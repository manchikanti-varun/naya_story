import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-stone-100 text-[var(--admin-muted)]",
  success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60",
  warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
  danger: "bg-red-50 text-red-800 ring-1 ring-red-200/60",
  accent: "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)] ring-1 ring-[var(--admin-accent)]/20",
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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.1em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
