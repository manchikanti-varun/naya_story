import type {
  SizeGuideConfig,
  SizeGuideRow,
  StorefrontSettings,
} from "@/types/storefront-settings";
import { DEFAULT_SIZE_GUIDE, DEFAULT_STOREFRONT_SETTINGS } from "@/types/storefront-settings";

export function mergeStorefrontSettings(raw: unknown): StorefrontSettings {
  const d = DEFAULT_STOREFRONT_SETTINGS;
  if (!raw || typeof raw !== "object") return { ...d, sizeGuide: { ...DEFAULT_SIZE_GUIDE, columns: [...DEFAULT_SIZE_GUIDE.columns], rows: [...DEFAULT_SIZE_GUIDE.rows] } };

  const r = raw as Record<string, unknown>;
  const mode = r.pdpSuggestedMode;
  const pdpSuggestedMode =
    mode === "collection" ||
    mode === "category" ||
    mode === "bestsellers" ||
    mode === "newIn" ||
    mode === "all" ||
    mode === "auto"
      ? mode
      : d.pdpSuggestedMode;

  const sgRaw = r.sizeGuide;
  let sizeGuide: SizeGuideConfig = { ...DEFAULT_SIZE_GUIDE, columns: [...DEFAULT_SIZE_GUIDE.columns], rows: [...DEFAULT_SIZE_GUIDE.rows] };
  if (sgRaw && typeof sgRaw === "object") {
    const sg = sgRaw as Record<string, unknown>;
    const cols = Array.isArray(sg.columns)
      ? (sg.columns as Record<string, unknown>[])
          .filter((c) => c && typeof c === "object")
          .map((c, i) => ({
            id: String(c.id ?? `col-${i}`),
            label: String(c.label ?? ""),
          }))
          .filter((c) => c.label.trim())
      : DEFAULT_SIZE_GUIDE.columns;

    const colIds = cols.map((c) => c.id);
    const rows = Array.isArray(sg.rows)
      ? (sg.rows as Record<string, unknown>[])
          .filter((row) => row && typeof row === "object")
          .map((row) => {
            const out: SizeGuideRow = { size: String(row.size ?? "") };
            for (const id of colIds) {
              if (id === "size") continue;
              out[id] = String(row[id] ?? "");
            }
            return out;
          })
          .filter((row) => row.size.trim())
      : DEFAULT_SIZE_GUIDE.rows;

    sizeGuide = {
      title: typeof sg.title === "string" ? sg.title : DEFAULT_SIZE_GUIDE.title,
      subtitle: typeof sg.subtitle === "string" ? sg.subtitle : DEFAULT_SIZE_GUIDE.subtitle,
      columns: cols.length ? cols : DEFAULT_SIZE_GUIDE.columns,
      rows: rows.length ? rows : DEFAULT_SIZE_GUIDE.rows,
    };
  }

  return { pdpSuggestedMode, sizeGuide };
}
