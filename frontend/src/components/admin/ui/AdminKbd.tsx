import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/** Keyboard shortcut indicator — e.g. ⌘K */
export function AdminKbd({ children, className }: Props) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-[5px] border border-[var(--admin-border-strong)] bg-[var(--admin-surface-raised)] px-1.5 font-mono text-[10px] font-medium text-[var(--admin-faint)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
