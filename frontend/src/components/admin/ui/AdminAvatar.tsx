import { cn } from "@/lib/cn";

type Props = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

function getColor(name: string): string {
  const colors = [
    "bg-amber-100 text-amber-800",
    "bg-emerald-100 text-emerald-800",
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-rose-100 text-rose-800",
    "bg-cyan-100 text-cyan-800",
    "bg-orange-100 text-orange-800",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

/**
 * Avatar component with initials fallback.
 * Color is deterministic based on name.
 */
export function AdminAvatar({ name, size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-sans font-semibold",
        sizeMap[size],
        getColor(name),
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
