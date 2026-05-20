import { limitedStockBarFill } from "@/lib/product-stock";

type Props = {
  totalStock: number;
};

export function LimitedStockBanner({ totalStock }: Props) {
  const fill = limitedStockBarFill(totalStock);

  return (
    <div
      className="mt-3 rounded-lux border border-amber-200/70 bg-amber-50/45 px-3 py-2.5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500"
          aria-hidden
        />
        <p className="font-sans text-sm leading-snug text-amber-950">
          <span className="font-medium">Only {totalStock} left</span>
          <span className="text-amber-900/85"> — Hurry! Limited stock left.</span>
        </p>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-amber-200/60"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-amber-500 transition-[width] duration-500 ease-out"
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}
