import { cn } from "@/lib/cn";
import { NayaLoader } from "@/components/ui/NayaLoader";

function ShimmerBlock({ className }: { className?: string }) {
  return <div className={cn("naya-shimmer rounded-sm", className)} aria-hidden />;
}

/** Next.js route-level fallback for the storefront shell. */
export function StoreRouteLoading() {
  return (
    <div className="lux-shell py-12 md:py-16">
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl space-y-4">
          <ShimmerBlock className="h-3 w-24 rounded-full" />
          <ShimmerBlock className="h-10 w-4/5 max-w-md" />
          <ShimmerBlock className="h-4 w-full max-w-sm" />
          <ShimmerBlock className="h-4 w-2/3 max-w-xs" />
        </div>
        <NayaLoader size="sm" className="md:pt-2" ariaLabel="Loading page" />
      </div>
      <ProductGridSkeleton className="mt-14" count={8} />
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4 lg:gap-x-6",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <ShimmerBlock className="aspect-[3/4] w-full rounded-lux" />
          <ShimmerBlock className="h-3 w-3/4" />
          <ShimmerBlock className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Editorial masonry placeholder for New In. */
export function MasonryLoadingSkeleton({ className }: { className?: string }) {
  const heights = ["h-72", "h-96", "h-80", "h-[22rem]", "h-64", "h-[26rem]"];
  return (
    <div
      className={cn("columns-1 [column-gap:0] md:columns-2 xl:columns-3", className)}
      aria-hidden
    >
      {heights.map((h, i) => (
        <div key={i} className="mb-0 break-inside-avoid">
          <ShimmerBlock className={cn("w-full rounded-none", h)} />
        </div>
      ))}
    </div>
  );
}

/** Centered in-page loading with optional CMS message. */
export function StoreInlineLoading({
  label = "Curating pieces",
  sublabel,
  variant = "grid",
  className,
}: {
  label?: string;
  sublabel?: string;
  variant?: "grid" | "masonry" | "minimal";
  className?: string;
}) {
  if (variant === "minimal") {
    return (
      <div className={cn("lux-shell py-20", className)}>
        <NayaLoader label={label} sublabel={sublabel} />
      </div>
    );
  }

  return (
    <div className={cn("lux-shell py-10 md:py-14", className)}>
      <div className="mb-10 flex justify-center">
        <NayaLoader label={label} sublabel={sublabel} size="md" />
      </div>
      {variant === "masonry" ? (
        <MasonryLoadingSkeleton />
      ) : (
        <ProductGridSkeleton count={8} />
      )}
    </div>
  );
}

export function CompareTableSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mt-10 space-y-4", className)} aria-hidden>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBlock key={i} className="h-48 w-40 shrink-0 rounded-lux" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <ShimmerBlock key={i} className="h-4 w-full max-w-2xl" />
      ))}
    </div>
  );
}

/** Compact loader for infinite scroll footers. */
export function StoreLoadingMore({ label = "Loading more" }: { label?: string }) {
  return (
    <div className="mt-8 flex justify-center py-4" role="status" aria-live="polite">
      <NayaLoader label={label} size="sm" />
    </div>
  );
}
