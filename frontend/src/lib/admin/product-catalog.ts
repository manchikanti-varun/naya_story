import type { Product } from "@/types";

/** Resolve Mongo product ids to display lines (preserves order). */
export function formatProductIdList(ids: string[], byId: Map<string, Product>): string[] {
  return ids.map((id) => {
    const p = byId.get(id);
    if (p) return p.name;
    return "Unknown product";
  });
}

export function productSubtitle(p: Product | undefined): string {
  if (!p) return "Not in catalog";
  if (p.slug?.trim()) return p.slug;
  const parts: string[] = [];
  if (p.category) parts.push(p.category);
  if (typeof p.price === "number") parts.push(`₹${p.price.toLocaleString("en-IN")}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}
