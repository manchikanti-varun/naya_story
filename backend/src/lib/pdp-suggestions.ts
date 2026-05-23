import type { Types } from "mongoose";
import { Product } from "../models/Product.js";
import type { PdpSuggestedMode } from "../types/storefront-settings.js";
import type { HomepageConfig } from "../types/homepage.js";

type LeanProduct = {
  _id: Types.ObjectId;
  category: string;
  collection?: string;
  [key: string]: unknown;
};

const LIMIT = 12;

async function fetchVisible(
  filter: Record<string, unknown>,
  excludeId: Types.ObjectId,
  limit: number,
) {
  if (limit <= 0) return [];
  return Product.find({
    ...filter,
    _id: { $ne: excludeId },
    storefrontVisible: { $ne: false },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function loadPdpSuggestedProducts(
  product: LeanProduct,
  mode: PdpSuggestedMode,
  homepage?: HomepageConfig | null,
): Promise<{ mode: PdpSuggestedMode; label: string; products: Record<string, unknown>[] }> {
  const id = product._id;
  const resolved = mode === "auto" ? "auto" : mode;

  const tryModes: PdpSuggestedMode[] =
    resolved === "auto"
      ? ["collection", "category", "bestsellers", "newIn", "all"]
      : [resolved];

  for (const m of tryModes) {
    let list: Record<string, unknown>[] = [];
    let label = "Suggested for you";

    if (m === "collection" && product.collection?.trim()) {
      list = await fetchVisible({ collection: product.collection.trim() }, id, LIMIT);
      label = "From the same collection";
    } else if (m === "category") {
      list = await fetchVisible({ category: product.category }, id, LIMIT);
      label = `More in ${product.category}`;
    } else if (m === "bestsellers") {
      const pinned = homepage?.bestsellers?.productIds ?? [];
      if (pinned.length) {
        const oids = pinned
          .map((pid) => pid)
          .filter((pid) => String(pid) !== String(id));
        const found = await Product.find({
          _id: { $in: oids },
          storefrontVisible: { $ne: false },
        }).lean();
        const byId = new Map(found.map((p) => [String(p._id), p]));
        list = pinned
          .map((pid) => byId.get(String(pid)))
          .filter((p): p is NonNullable<typeof p> => Boolean(p))
          .slice(0, LIMIT) as Record<string, unknown>[];
      }
      if (list.length < 4) {
        const more = await fetchVisible({ bestseller: true }, id, LIMIT);
        const seen = new Set(list.map((p) => String(p._id)));
        for (const p of more) {
          if (list.length >= LIMIT) break;
          if (seen.has(String(p._id))) continue;
          seen.add(String(p._id));
          list.push(p as Record<string, unknown>);
        }
      }
      label = "Bestsellers";
    } else if (m === "newIn") {
      list = await fetchVisible({ newIn: true, newInVisible: { $ne: false } }, id, LIMIT);
      label = "New in";
    } else if (m === "all") {
      list = await fetchVisible({}, id, LIMIT);
      label = "You may also like";
    }

    if (list.length > 0) {
      return { mode: m, label, products: list };
    }
  }

  return { mode: resolved, label: "Suggested for you", products: [] };
}
