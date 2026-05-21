import { cn } from "@/lib/cn";

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-14 w-14",
} as const;

type Props = {
  label?: string;
  sublabel?: string;
  size?: keyof typeof sizeMap;
  className?: string;
  /** Visually hidden text for screen readers when label is omitted */
  ariaLabel?: string;
};

/** Branded gold-orbit loader for storefront and auth flows. */
export function NayaLoader({
  label,
  sublabel,
  size = "md",
  className,
  ariaLabel = "Loading",
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex flex-col items-center justify-center text-center", className)}
    >
      <div className={cn("relative", sizeMap[size])} aria-hidden>
        <span className="absolute inset-0 rounded-full border border-ivory-deep/70" />
        <span className="naya-loader-orbit absolute inset-0 rounded-full border-2 border-transparent border-t-gold border-r-gold/35" />
        <span className="absolute inset-[32%] rounded-full bg-gold/15" />
        <span className="absolute inset-[42%] rounded-full bg-gold/40 animate-pulse" />
      </div>
      {label ? (
        <p className="mt-6 font-sans text-[11px] font-light uppercase tracking-[0.28em] text-ink-muted">
          {label}
        </p>
      ) : (
        <span className="sr-only">{ariaLabel}</span>
      )}
      {sublabel ? (
        <p className="mt-2 max-w-xs font-sans text-xs font-light leading-relaxed text-ink-soft">
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}
