import type { Product } from "@/types";

/** Merge legacy split description fields into one block for the admin editor. */
export function consolidateProductDescription(p: Pick<
  Product,
  "description" | "shortDescription" | "fabricDetails" | "stylingSuggestions"
>): string {
  const main = p.description?.trim() ?? "";
  const extras = [p.shortDescription, p.fabricDetails, p.stylingSuggestions]
    .map((s) => s?.trim())
    .filter(Boolean) as string[];

  if (!extras.length) return main;

  const uniqueExtras = extras.filter((e) => !main.includes(e));
  if (!main) return uniqueExtras.join("\n\n");
  if (!uniqueExtras.length) return main;
  return [main, ...uniqueExtras].join("\n\n");
}
