import type { StorefrontSettings, SizeGuideConfig, SizeGuideColumn, SizeGuideRow } from "../types/storefront-settings.js";

const DEFAULT_SIZE_GUIDE: SizeGuideConfig = {
  title: "Size chart",
  subtitle: "Measurements in centimetres. Between sizes? We recommend sizing up.",
  columns: [
    { id: "size", label: "Size" },
    { id: "bust", label: "Bust" },
    { id: "waist", label: "Waist" },
    { id: "hip", label: "Hip" },
  ],
  rows: [
    { size: "XS", bust: "80", waist: "62", hip: "88" },
    { size: "S", bust: "84", waist: "66", hip: "92" },
    { size: "M", bust: "88", waist: "70", hip: "96" },
    { size: "L", bust: "92", waist: "74", hip: "100" },
    { size: "XL", bust: "96", waist: "78", hip: "104" },
  ],
};

export function mergeStorefrontSettings(raw: unknown): StorefrontSettings {
  if (!raw || typeof raw !== "object") {
    return { pdpSuggestedMode: "auto", sizeGuide: DEFAULT_SIZE_GUIDE };
  }
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
      : "auto";

  const sgRaw = r.sizeGuide;
  if (!sgRaw || typeof sgRaw !== "object") {
    return { pdpSuggestedMode, sizeGuide: DEFAULT_SIZE_GUIDE };
  }
  const sg = sgRaw as Record<string, unknown>;
  const columns = Array.isArray(sg.columns)
    ? (sg.columns as Record<string, unknown>[])
        .filter((c) => c && typeof c === "object")
        .map((c, i) => ({
          id: String(c.id ?? `col-${i}`),
          label: String(c.label ?? ""),
        }))
        .filter((c) => c.label.trim())
    : DEFAULT_SIZE_GUIDE.columns;

  const colIds = columns.map((c) => c.id);
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

  // Inch table (separate, not merged with CM)
  let inchColumns: SizeGuideColumn[] | undefined;
  let inchRows: SizeGuideRow[] | undefined;
  if (Array.isArray(sg.inchColumns) && (sg.inchColumns as unknown[]).length > 0) {
    inchColumns = (sg.inchColumns as Record<string, unknown>[])
      .filter((c) => c && typeof c === "object")
      .map((c, i) => ({
        id: String(c.id ?? `icol-${i}`),
        label: String(c.label ?? ""),
      }))
      .filter((c) => c.label.trim());

    if (inchColumns.length > 0 && Array.isArray(sg.inchRows)) {
      const inchColIds = inchColumns.map((c) => c.id);
      inchRows = (sg.inchRows as Record<string, unknown>[])
        .filter((row) => row && typeof row === "object")
        .map((row) => {
          const out: SizeGuideRow = { size: String(row.size ?? "") };
          for (const id of inchColIds) {
            if (id === "size") continue;
            out[id] = String(row[id] ?? "");
          }
          return out;
        });
    }
  }

  const defaultUnit = sg.defaultUnit === "inch" ? "inch" as const : "cm" as const;

  return {
    pdpSuggestedMode,
    sizeGuide: {
      title: typeof sg.title === "string" ? sg.title : DEFAULT_SIZE_GUIDE.title,
      subtitle: typeof sg.subtitle === "string" ? sg.subtitle : DEFAULT_SIZE_GUIDE.subtitle,
      columns: columns.length ? columns : DEFAULT_SIZE_GUIDE.columns,
      rows: rows.length ? rows : DEFAULT_SIZE_GUIDE.rows,
      ...(inchColumns && inchColumns.length > 0 ? { inchColumns } : {}),
      ...(inchRows && inchRows.length > 0 ? { inchRows } : {}),
      defaultUnit,
    },
  };
}
