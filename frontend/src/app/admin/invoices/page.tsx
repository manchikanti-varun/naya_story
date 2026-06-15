"use client";

import { useRef, useState } from "react";
import { Download, Eye } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { InvoiceTemplate, getSampleInvoiceData } from "@/components/admin/InvoiceTemplate";
import type { InvoiceData } from "@/components/admin/InvoiceTemplate";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/admin/ui/AdminToast";

export default function AdminInvoicesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const sampleData = getSampleInvoiceData();

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
            .text-green { color: #15803d; }
            .text-amber { color: #b45309; }
            .text-gray { color: #6b7280; }
            .text-sm { font-size: 11px; }
            .mt-2 { margin-top: 8px; }
            .mt-4 { margin-top: 16px; }
            .mt-6 { margin-top: 24px; }
            .border-t { border-top: 1px solid #e5e7eb; padding-top: 12px; }
            .header { display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
            .totals { margin-left: auto; width: 260px; }
            .totals .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .grand-total { border-top: 1px solid #333; padding-top: 8px; font-weight: 700; font-size: 14px; }
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
      description="Sample invoice format — same template used for customer invoices"
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
          <AdminButton variant="primary" size="sm" onClick={handlePrint}>
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            Print / Download PDF
          </AdminButton>
        </div>
      }
    >
      <div className="rounded-xl border border-[var(--admin-border)] bg-white p-2 shadow-sm">
        <div ref={printRef}>
          <InvoiceTemplate data={displayData} isSample={isSample} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] p-4">
        <p className="text-xs font-medium text-[var(--admin-ink)]">How invoices work</p>
        <ul className="mt-2 space-y-1 text-xs text-[var(--admin-muted)]">
          <li>• This exact template is sent to customers after successful payment.</li>
          <li>• MRP is GST inclusive — GST is extracted (not added) for the invoice.</li>
          <li>• Formula: Taxable Value = MRP ÷ (1 + GST Rate), GST = MRP − Taxable Value</li>
          <li>• CGST & SGST are split equally (intra-state). IGST for inter-state.</li>
          <li>• Download invoice from any order in the Orders dashboard.</li>
        </ul>
      </div>
    </AdminPageLayout>
  );
}
