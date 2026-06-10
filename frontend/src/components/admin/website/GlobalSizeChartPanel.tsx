"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  SizeGuideColumn,
  SizeGuideConfig,
  SizeGuideRow,
  StorefrontSettings,
} from "@/types/storefront-settings";
import { DEFAULT_SIZE_GUIDE } from "@/types/storefront-settings";
import { CmsFormGrid, CmsPageEditorShell } from "@/components/admin/cms/CmsFormHelpers";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/ui/AdminField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { useStorefrontSettings } from "@/components/admin/website/use-storefront-settings";
import { cn } from "@/lib/cn";

export function GlobalSizeChartPanel() {
  const { storefront, setStorefront, isDirty, saving, msg, save, discard, loading } =
    useStorefrontSettings();
  const [activeTab, setActiveTab] = useState<"cm" | "inch">("cm");

  if (loading || !storefront?.sizeGuide) {
    return <p className="font-sans text-sm text-[var(--admin-muted)]">Loading size chart…</p>;
  }

  const guide = storefront.sizeGuide;

  // CM data
  const cmColumns = guide.columns?.length ? guide.columns : DEFAULT_SIZE_GUIDE.columns;
  const cmRows = guide.rows?.length ? guide.rows : DEFAULT_SIZE_GUIDE.rows;

  // Inch data
  const inchColumns = guide.inchColumns ?? [];
  const inchRows = guide.inchRows ?? [];
  const hasInch = inchColumns.length > 0;

  return (
    <CmsPageEditorShell
      title="Size chart"
      description="One global fit guide for the whole shop. Create separate tables for CM and Inches — customers toggle between them."
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
        <AdminField label="Default unit on storefront">
          <AdminSelect
            value={guide.defaultUnit ?? "cm"}
            onChange={(e) => updateSizeGuide(storefront, setStorefront, { defaultUnit: e.target.value as "cm" | "inch" })}
          >
            <option value="cm">Centimetres (CM)</option>
            <option value="inch">Inches</option>
          </AdminSelect>
        </AdminField>
      </CmsFormGrid>

      {/* Tab toggle */}
      <div className="mt-6 flex items-center gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("cm")}
          className={cn(
            "rounded-md px-4 py-2 font-sans text-xs font-medium transition-all",
            activeTab === "cm"
              ? "bg-[var(--admin-surface)] text-[var(--admin-ink)] shadow-sm"
              : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
          )}
        >
          CM Table
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inch")}
          className={cn(
            "rounded-md px-4 py-2 font-sans text-xs font-medium transition-all",
            activeTab === "inch"
              ? "bg-[var(--admin-surface)] text-[var(--admin-ink)] shadow-sm"
              : "text-[var(--admin-muted)] hover:text-[var(--admin-ink)]",
          )}
        >
          Inches Table
        </button>
      </div>

      {/* CM Table */}
      {activeTab === "cm" ? (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--admin-border)]">
            <table className="min-w-[480px] w-full text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface)]">
                  {cmColumns.map((col, colIdx) => (
                    <th key={col.id} className="p-2">
                      <div className="flex items-center gap-1">
                        <AdminInput
                          className="text-xs"
                          value={col.label}
                          onChange={(e) => {
                            const columns = [...cmColumns];
                            columns[colIdx] = { ...col, label: e.target.value };
                            updateSizeGuide(storefront, setStorefront, { columns });
                          }}
                        />
                        {cmColumns.length > 1 && col.id !== "size" ? (
                          <button
                            type="button"
                            className="rounded p-1 text-[var(--admin-muted)] hover:text-red-600"
                            aria-label={`Remove column ${col.label}`}
                            onClick={() => removeColumn(storefront, setStorefront, col.id, "cm")}
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
                {cmRows.map((row, rowIdx) => (
                  <tr key={`${row.size}-${rowIdx}`} className="border-b border-[var(--admin-border)]/60">
                    {cmColumns.map((col) => (
                      <td key={col.id} className="p-2">
                        <AdminInput
                          className="text-xs"
                          value={row[col.id] ?? ""}
                          onChange={(e) =>
                            updateRowCell(storefront, setStorefront, rowIdx, col.id, e.target.value, "cm")
                          }
                        />
                      </td>
                    ))}
                    <td className="p-2">
                      <button
                        type="button"
                        className="rounded p-1 text-[var(--admin-muted)] hover:text-red-600"
                        aria-label="Remove row"
                        onClick={() => removeRow(storefront, setStorefront, rowIdx, "cm")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminButton type="button" variant="secondary" size="sm" onClick={() => addRow(storefront, setStorefront, "cm")}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add row
            </AdminButton>
            <AdminButton type="button" variant="secondary" size="sm" onClick={() => addColumn(storefront, setStorefront, "cm")}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add column
            </AdminButton>
          </div>
        </>
      ) : (
        <>
          {/* Inches Table */}
          {!hasInch ? (
            <div className="mt-4 rounded-lg border border-dashed border-[var(--admin-border)] px-4 py-8 text-center">
              <p className="font-sans text-sm text-[var(--admin-muted)]">No inch table yet.</p>
              <p className="mt-1 font-sans text-xs text-[var(--admin-faint)]">
                Create one from scratch or copy from the CM table and convert.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // Create empty inch table with same structure as CM
                    const inchCols = cmColumns.map((c) => ({ ...c }));
                    const inchRws: SizeGuideRow[] = cmRows.map((r) => {
                      const row: SizeGuideRow = { size: r.size };
                      for (const col of cmColumns) {
                        if (col.id !== "size") row[col.id] = "";
                      }
                      return row;
                    });
                    updateSizeGuide(storefront, setStorefront, {
                      inchColumns: inchCols,
                      inchRows: inchRws,
                    });
                  }}
                >
                  Create empty inch table
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Copy CM values (user can manually convert)
                    updateSizeGuide(storefront, setStorefront, {
                      inchColumns: cmColumns.map((c) => ({ ...c })),
                      inchRows: cmRows.map((r) => ({ ...r })),
                    });
                  }}
                >
                  Copy from CM table
                </AdminButton>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--admin-border)]">
                <table className="min-w-[480px] w-full text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface)]">
                      {inchColumns.map((col, colIdx) => (
                        <th key={col.id} className="p-2">
                          <div className="flex items-center gap-1">
                            <AdminInput
                              className="text-xs"
                              value={col.label}
                              onChange={(e) => {
                                const columns = [...inchColumns];
                                columns[colIdx] = { ...col, label: e.target.value };
                                updateSizeGuide(storefront, setStorefront, { inchColumns: columns });
                              }}
                            />
                            {inchColumns.length > 1 && col.id !== "size" ? (
                              <button
                                type="button"
                                className="rounded p-1 text-[var(--admin-muted)] hover:text-red-600"
                                aria-label={`Remove column ${col.label}`}
                                onClick={() => removeColumn(storefront, setStorefront, col.id, "inch")}
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
                    {inchRows.map((row, rowIdx) => (
                      <tr key={`${row.size}-${rowIdx}`} className="border-b border-[var(--admin-border)]/60">
                        {inchColumns.map((col) => (
                          <td key={col.id} className="p-2">
                            <AdminInput
                              className="text-xs"
                              value={row[col.id] ?? ""}
                              onChange={(e) =>
                                updateRowCell(storefront, setStorefront, rowIdx, col.id, e.target.value, "inch")
                              }
                            />
                          </td>
                        ))}
                        <td className="p-2">
                          <button
                            type="button"
                            className="rounded p-1 text-[var(--admin-muted)] hover:text-red-600"
                            aria-label="Remove row"
                            onClick={() => removeRow(storefront, setStorefront, rowIdx, "inch")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <AdminButton type="button" variant="secondary" size="sm" onClick={() => addRow(storefront, setStorefront, "inch")}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add row
                </AdminButton>
                <AdminButton type="button" variant="secondary" size="sm" onClick={() => addColumn(storefront, setStorefront, "inch")}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add column
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => updateSizeGuide(storefront, setStorefront, { inchColumns: undefined, inchRows: undefined })}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove inch table
                </AdminButton>
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
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
          Reset all to defaults
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
  unit: "cm" | "inch",
) {
  const guide = storefront.sizeGuide!;
  if (unit === "cm") {
    const rows = guide.rows.map((r, i) => (i === rowIdx ? { ...r, [colId]: value } : r));
    setStorefront({ ...storefront, sizeGuide: { ...guide, rows } });
  } else {
    const rows = (guide.inchRows ?? []).map((r, i) => (i === rowIdx ? { ...r, [colId]: value } : r));
    setStorefront({ ...storefront, sizeGuide: { ...guide, inchRows: rows } });
  }
}

function addRow(storefront: StorefrontSettings, setStorefront: (s: StorefrontSettings) => void, unit: "cm" | "inch") {
  const guide = storefront.sizeGuide!;
  if (unit === "cm") {
    const row: SizeGuideRow = { size: "" };
    for (const col of guide.columns) {
      if (col.id !== "size") row[col.id] = "";
    }
    setStorefront({ ...storefront, sizeGuide: { ...guide, rows: [...guide.rows, row] } });
  } else {
    const cols = guide.inchColumns ?? [];
    const row: SizeGuideRow = { size: "" };
    for (const col of cols) {
      if (col.id !== "size") row[col.id] = "";
    }
    setStorefront({ ...storefront, sizeGuide: { ...guide, inchRows: [...(guide.inchRows ?? []), row] } });
  }
}

function removeRow(storefront: StorefrontSettings, setStorefront: (s: StorefrontSettings) => void, rowIdx: number, unit: "cm" | "inch") {
  const guide = storefront.sizeGuide!;
  if (unit === "cm") {
    setStorefront({ ...storefront, sizeGuide: { ...guide, rows: guide.rows.filter((_, i) => i !== rowIdx) } });
  } else {
    setStorefront({ ...storefront, sizeGuide: { ...guide, inchRows: (guide.inchRows ?? []).filter((_, i) => i !== rowIdx) } });
  }
}

function addColumn(storefront: StorefrontSettings, setStorefront: (s: StorefrontSettings) => void, unit: "cm" | "inch") {
  const guide = storefront.sizeGuide!;
  if (unit === "cm") {
    const id = `m${guide.columns.length}`;
    const col: SizeGuideColumn = { id, label: "Measurement" };
    const rows = guide.rows.map((r) => ({ ...r, [id]: "" }));
    setStorefront({ ...storefront, sizeGuide: { ...guide, columns: [...guide.columns, col], rows } });
  } else {
    const cols = guide.inchColumns ?? [];
    const id = `im${cols.length}`;
    const col: SizeGuideColumn = { id, label: "Measurement" };
    const rows = (guide.inchRows ?? []).map((r) => ({ ...r, [id]: "" }));
    setStorefront({ ...storefront, sizeGuide: { ...guide, inchColumns: [...cols, col], inchRows: rows } });
  }
}

function removeColumn(storefront: StorefrontSettings, setStorefront: (s: StorefrontSettings) => void, colId: string, unit: "cm" | "inch") {
  const guide = storefront.sizeGuide!;
  if (colId === "size") return;
  if (unit === "cm") {
    const columns = guide.columns.filter((c) => c.id !== colId);
    const rows = guide.rows.map((r) => { const next = { ...r }; delete next[colId]; return next; });
    setStorefront({ ...storefront, sizeGuide: { ...guide, columns, rows } });
  } else {
    const columns = (guide.inchColumns ?? []).filter((c) => c.id !== colId);
    const rows = (guide.inchRows ?? []).map((r) => { const next = { ...r }; delete next[colId]; return next; });
    setStorefront({ ...storefront, sizeGuide: { ...guide, inchColumns: columns, inchRows: rows } });
  }
}
