"use client";

import { Plus, Trash2 } from "lucide-react";
import type {
  SizeGuideColumn,
  SizeGuideConfig,
  SizeGuideRow,
  StorefrontSettings,
} from "@/types/storefront-settings";
import { DEFAULT_SIZE_GUIDE } from "@/types/storefront-settings";
import { CmsFormGrid, CmsPageEditorShell } from "@/components/admin/cms/CmsFormHelpers";
import { AdminField, AdminInput } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { useStorefrontSettings } from "@/components/admin/website/use-storefront-settings";

export function GlobalSizeChartPanel() {
  const { storefront, setStorefront, isDirty, saving, msg, save, discard, loading } =
    useStorefrontSettings();

  if (loading || !storefront?.sizeGuide) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading size chart…</p>;
  }

  const guide = storefront.sizeGuide;

  return (
    <CmsPageEditorShell
      title="Size chart"
      description="One global fit guide for the whole shop. Shoppers open it from SIZE CHART on any product page — edit here once and it applies everywhere."
    >
      <CmsFormGrid>
        <AdminField label="Modal title">
          <AdminInput
            value={guide.title ?? ""}
            onChange={(e) => updateSizeGuide(storefront, setStorefront, { title: e.target.value })}
          />
        </AdminField>
        <AdminField label="Subtitle" className="md:col-span-2">
          <AdminInput
            value={guide.subtitle ?? ""}
            onChange={(e) => updateSizeGuide(storefront, setStorefront, { subtitle: e.target.value })}
          />
        </AdminField>
      </CmsFormGrid>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--admin-border)]">
        <table className="min-w-[480px] w-full text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface)]">
              {guide.columns.map((col, colIdx) => (
                <th key={col.id} className="p-2">
                  <div className="flex items-center gap-1">
                    <AdminInput
                      className="text-xs"
                      value={col.label}
                      onChange={(e) => {
                        const columns = [...guide.columns];
                        columns[colIdx] = { ...col, label: e.target.value };
                        updateSizeGuide(storefront, setStorefront, { columns });
                      }}
                    />
                    {guide.columns.length > 1 && col.id !== "size" ? (
                      <button
                        type="button"
                        className="rounded p-1 text-[var(--admin-muted)] hover:text-red-600"
                        aria-label={`Remove column ${col.label}`}
                        onClick={() => removeColumn(storefront, setStorefront, col.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </th>
              ))}
              <th className="w-10 p-2" />
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row, rowIdx) => (
              <tr key={`${row.size}-${rowIdx}`} className="border-b border-[var(--admin-border)]/60">
                {guide.columns.map((col) => (
                  <td key={col.id} className="p-2">
                    <AdminInput
                      className="text-xs"
                      value={row[col.id] ?? ""}
                      onChange={(e) =>
                        updateRowCell(storefront, setStorefront, rowIdx, col.id, e.target.value)
                      }
                    />
                  </td>
                ))}
                <td className="p-2">
                  <button
                    type="button"
                    className="rounded p-1 text-[var(--admin-muted)] hover:text-red-600"
                    aria-label="Remove row"
                    onClick={() => removeRow(storefront, setStorefront, rowIdx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AdminButton type="button" variant="secondary" size="sm" onClick={() => addRow(storefront, setStorefront)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add size row
        </AdminButton>
        <AdminButton type="button" variant="secondary" size="sm" onClick={() => addColumn(storefront, setStorefront)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add measurement column
        </AdminButton>
        <AdminButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setStorefront({
              ...storefront,
              sizeGuide: structuredClone(DEFAULT_SIZE_GUIDE),
            })
          }
        >
          Reset to defaults
        </AdminButton>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--admin-border)] pt-6">
        <AdminButton type="button" onClick={() => void save()} disabled={!isDirty || saving}>
          {saving ? "Saving…" : "Save"}
        </AdminButton>
        {isDirty ? (
          <AdminButton type="button" variant="ghost" onClick={discard}>
            Discard
          </AdminButton>
        ) : null}
        {msg ? <p className="font-sans text-xs text-[var(--admin-muted)]">{msg}</p> : null}
      </div>
    </CmsPageEditorShell>
  );
}

function updateSizeGuide(
  storefront: StorefrontSettings,
  setStorefront: (s: StorefrontSettings) => void,
  patch: Partial<SizeGuideConfig>,
) {
  const sizeGuide = { ...storefront.sizeGuide!, ...patch };
  setStorefront({ ...storefront, sizeGuide });
}

function updateRowCell(
  storefront: StorefrontSettings,
  setStorefront: (s: StorefrontSettings) => void,
  rowIdx: number,
  colId: string,
  value: string,
) {
  const guide = storefront.sizeGuide!;
  const rows = guide.rows.map((r, i) => (i === rowIdx ? { ...r, [colId]: value } : r));
  setStorefront({ ...storefront, sizeGuide: { ...guide, rows } });
}

function addRow(storefront: StorefrontSettings, setStorefront: (s: StorefrontSettings) => void) {
  const guide = storefront.sizeGuide!;
  const row: SizeGuideRow = { size: "" };
  for (const col of guide.columns) {
    if (col.id !== "size") row[col.id] = "";
  }
  setStorefront({ ...storefront, sizeGuide: { ...guide, rows: [...guide.rows, row] } });
}

function removeRow(storefront: StorefrontSettings, setStorefront: (s: StorefrontSettings) => void, rowIdx: number) {
  const guide = storefront.sizeGuide!;
  setStorefront({
    ...storefront,
    sizeGuide: { ...guide, rows: guide.rows.filter((_, i) => i !== rowIdx) },
  });
}

function addColumn(storefront: StorefrontSettings, setStorefront: (s: StorefrontSettings) => void) {
  const guide = storefront.sizeGuide!;
  const id = `m${guide.columns.length}`;
  const col: SizeGuideColumn = { id, label: "Measurement" };
  const rows = guide.rows.map((r) => ({ ...r, [id]: r[id] ?? "" }));
  setStorefront({ ...storefront, sizeGuide: { ...guide, columns: [...guide.columns, col], rows } });
}

function removeColumn(storefront: StorefrontSettings, setStorefront: (s: StorefrontSettings) => void, colId: string) {
  const guide = storefront.sizeGuide!;
  if (colId === "size") return;
  const columns = guide.columns.filter((c) => c.id !== colId);
  const rows = guide.rows.map((r) => {
    const next = { ...r };
    delete next[colId];
    return next;
  });
  setStorefront({ ...storefront, sizeGuide: { ...guide, columns, rows } });
}
