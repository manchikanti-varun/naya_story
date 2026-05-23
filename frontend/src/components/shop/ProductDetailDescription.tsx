import type { Product } from "@/types";
import {
  bulletsFromStylingNotes,
  parseProductDescription,
} from "@/lib/parse-product-description";
import { cn } from "@/lib/cn";

const DEFAULT_PRINT_DISCLAIMER =
  "Print and placement may differ, making every piece uniquely yours.";

type Props = {
  product: Product;
  className?: string;
};

export function ProductDetailDescription({ product, className }: Props) {
  const parsed = parseProductDescription(product.description);
  const legacyBullets = bulletsFromStylingNotes(product.stylingSuggestions);
  const bullets = parsed.bullets.length > 0 ? parsed.bullets : legacyBullets;

  const intro =
    parsed.intro ||
    product.shortDescription?.trim() ||
    (bullets.length === 0 ? product.description?.trim() : "");

  const fabricRaw =
    product.fabricDetails?.trim() || product.material?.trim() || null;
  const fabricLabel = fabricRaw
    ? /^fabric used:/i.test(fabricRaw)
      ? fabricRaw
      : `Fabric used: ${fabricRaw}`
    : null;

  const printDisclaimer =
    product.pdpPrintDisclaimer?.trim() || DEFAULT_PRINT_DISCLAIMER;

  if (!intro && bullets.length === 0 && !fabricLabel) {
    return null;
  }

  return (
    <div className={cn("space-y-3 border-b border-ivory-deep/70 pb-4", className)}>
      {intro ? (
        <p className="font-sans text-sm font-light leading-[1.75] text-ink-muted">{intro}</p>
      ) : null}

      {bullets.length > 0 ? (
        <ul className="space-y-1.5 font-sans text-sm font-light leading-[1.65] text-ink-muted">
          {bullets.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="shrink-0 text-gold/70" aria-hidden>
                ›
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {fabricLabel ? (
        <p className="font-sans text-sm font-light text-ink-muted">{fabricLabel}</p>
      ) : null}

      <p className="font-sans text-[11px] font-light leading-relaxed text-ink-soft">
        {printDisclaimer}
      </p>
    </div>
  );
}
