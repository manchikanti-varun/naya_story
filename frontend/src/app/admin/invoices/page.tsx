"use client";

import { useRef, useState } from "react";
import { Download, Eye, Settings } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { InvoiceTemplate, getSampleInvoiceData, DEFAULT_VISIBILITY } from "@/components/admin/InvoiceTemplate";
import type { InvoiceData, InvoiceVisibility } from "@/components/admin/InvoiceTemplate";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/admin/ui/AdminToast";

const VISIBILITY_KEY = "naya_invoice_visibility";

function loadVisibility(): InvoiceVisibility {
  if (typeof window === "undefined") return DEFAULT_VISIBILITY;
  try {
    const raw = localStorage.getItem(VISIBILITY_KEY);
    if (!raw) return DEFAULT_VISIBILITY;
    return { ...DEFAULT_VISIBILITY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VISIBILITY;
  }
}

function saveVisibility(v: InvoiceVisibility) {
  try { localStorage.setItem(VISIBILITY_KEY, JSON.stringify(v)); } catch { /* */ }
}

type FieldGroup = { label: string; fields: { key: keyof InvoiceVisibility; label: string }[] };

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: "Store Details",
    fields: [
      { key: "storeName", label: "Store name" },
      { key: "storeAddress", label: "Store address" },
      { key: "storeGstin", label: "GSTIN" },
      { key: "storePhone", label: "Store phone" },
      { key: "storeEmail", label: "Store email" },
    ],
  },
  {
    label: "Invoice & Order Info",
    fields: [
      { key: "invoiceNumber", label: "Invoice number" },
      { key: "invoiceDate", label: "Invoice date" },
      { key: "orderNumber", label: "Order number" },
      { key: "orderDate", label: "Order date" },
    ],
  },
  {
    label: "Customer Info",
    fields: [
      { key: "customerName", label: "Customer name" },
      { key: "customerEmail", label: "Customer email" },
      { key: "customerPhone", label: "Customer phone" },
      { key: "shippingAddress", label: "Shipping address" },
    ],
  },
  {
    label: "Item Table Columns",
    fields: [
      { key: "hsnCode", label: "HSN code" },
      { key: "sku", label: "SKU" },
      { key: "sizeColor", label: "Size / Color" },
      { key: "mrpColumn", label: "MRP column" },
      { key: "taxableColumn", label: "Taxable value column" },
      { key: "gstPercentColumn", label: "GST % column" },
      { key: "cgstColumn", label: "CGST column" },
      { key: "sgstColumn", label: "SGST column" },
      { key: "igstColumn", label: "IGST column" },
    ],
  },
  {
    label: "Totals Section",
    fields: [
      { key: "subtotal", label: "Subtotal" },
      { key: "discount", label: "Discount" },
      { key: "taxableValue", label: "Total taxable value" },
      { key: "cgstTotal", label: "Total CGST" },
      { key: "sgstTotal", label: "Total SGST" },
      { key: "igstTotal", label: "Total IGST" },
      { key: "shipping", label: "Shipping charge" },
    ],
  },
  {
    label: "Footer",
    fields: [
      { key: "paymentInfo", label: "Payment method & status" },
    ],
  },
];

export default function AdminInvoicesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<InvoiceVisibility>(loadVisibility);
  const [showSettings, setShowSettings] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const sampleData = getSampleInvoiceData();

  function toggleField(key: keyof InvoiceVisibility) {
    setVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveVisibility(next);
      return next;
    });
  }

  function resetVisibility() {
    setVisibility(DEFAULT_VISIBILITY);
    saveVisibility(DEFAULT_VISIBILITY);
  }

  async function fetchRealInvoice() {
    if (!token || !orderIdInput.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ invoice: InvoiceData }>(
        `/invoices/orders/${orderIdInput.trim()}/invoice`,
        { token },
      );
      setInvoiceData(data.invoice);
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to fetch invoice");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #111; padding: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 6px 8px; text-align: left; }
            th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 1px solid #ddd; }
            td { border-bottom: 1px solid #f0f0f0; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-medium { font-weight: 500; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  const displayData = invoiceData ?? sampleData;
  const isSample = !invoiceData;

  return (
    <AdminPageLayout
      title="Invoice Preview"
      description="Configure which fields appear on customer invoices"
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            className="admin-input w-auto"
            placeholder="Order ID to preview real invoice"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
          />
          <AdminButton variant="secondary" size="sm" disabled={!orderIdInput.trim() || loading} onClick={fetchRealInvoice}>
            <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
            {loading ? "Loading…" : "Load invoice"}
          </AdminButton>
          {invoiceData && (
            <AdminButton variant="ghost" size="sm" onClick={() => setInvoiceData(null)}>
              Show sample
            </AdminButton>
          )}
          <AdminButton variant={showSettings ? "primary" : "secondary"} size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-3.5 w-3.5" strokeWidth={1.75} />
            {showSettings ? "Hide settings" : "Configure fields"}
          </AdminButton>
          <AdminButton variant="primary" size="sm" onClick={handlePrint}>
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            Print / PDF
          </AdminButton>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Invoice Preview */}
        <div className="rounded-xl border border-[var(--admin-border)] bg-white p-2 shadow-sm">
          <div ref={printRef}>
            <InvoiceTemplate data={displayData} isSample={isSample} visibility={visibility} />
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--admin-ink)]">Visible Fields</p>
              <button
                type="button"
                onClick={resetVisibility}
                className="text-[11px] text-[var(--admin-accent)] hover:underline"
              >
                Reset to default
              </button>
            </div>
            {FIELD_GROUPS.map((group) => (
              <div key={group.label} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-muted)]">{group.label}</p>
                <div className="space-y-1.5">
                  {group.fields.map((field) => (
                    <label key={field.key} className="flex cursor-pointer items-center gap-2 text-xs text-[var(--admin-ink)]">
                      <input
                        type="checkbox"
                        checked={visibility[field.key]}
                        onChange={() => toggleField(field.key)}
                        className="h-3.5 w-3.5 rounded border-gray-300 accent-[var(--admin-accent)]"
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-[var(--admin-faint)]">
              Settings are saved locally. Toggle fields to show/hide them on all invoices.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] p-4">
        <p className="text-xs font-medium text-[var(--admin-ink)]">How invoices work</p>
        <ul className="mt-2 space-y-1 text-xs text-[var(--admin-muted)]">
          <li>• This exact template is sent to customers after successful payment.</li>
          <li>• Toggle "Configure fields" to control what appears on the invoice.</li>
          <li>• MRP is GST inclusive — GST is extracted (not added) for the invoice.</li>
          <li>• Formula: Taxable Value = MRP ÷ (1 + GST Rate), GST = MRP − Taxable Value</li>
          <li>• CGST & SGST are split equally (intra-state). IGST for inter-state.</li>
        </ul>
      </div>
    </AdminPageLayout>
  );
}
