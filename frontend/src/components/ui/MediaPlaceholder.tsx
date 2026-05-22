import { cn } from "@/lib/cn";

/** Empty image slot when no CMS / product URL is set. */
export function MediaPlaceholder({
  className,
  label = "Add image in admin",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-ivory-soft via-ivory-muted to-ivory-deep/30",
        className,
      )}
      aria-hidden
    >
      <span className="max-w-[12rem] px-4 text-center font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft/70">
        {label}
      </span>
    </div>
  );
}
