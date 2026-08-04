import type { Product } from "@/types";

/**
 * Merge legacy split description fields into one block for the admin editor.
 * If the main description is already HTML (from the rich text editor),
 * skip merging legacy plain-text fields to avoid corrupting the HTML.
 */
export function consolidateProductDescription(p: Pick<
  Product,
  "description" | "shortDescription" | "fabricDetails" | "stylingSuggestions"
>): string {
  const main = p.description?.trim() ?? "";

  // If description is already rich HTML, return as-is (don't mix in plain text)
  if (main && /<[a-z][\s\S]*>/i.test(main)) return main;

  const extras = [p.shortDescription, p.fabricDetails, p.stylingSuggestions]
    .map((s) => s?.trim())
    .filter(Boolean) as string[];

  if (!extras.length) return main;

  const uniqueExtras = extras.filter((e) => !main.includes(e));
  if (!main) return uniqueExtras.join("\n\n");
  if (!uniqueExtras.length) return main;
  return [main, ...uniqueExtras].join("\n\n");
}
