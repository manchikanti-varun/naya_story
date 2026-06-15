"use client";

/**
 * GST Invoice Template — used for both sample preview and real invoice rendering.
 * This exact template is what customers receive after payment.
 */

export type InvoiceLineItem = {
  name: string;
  sku: string;
  size?: string;
  color?: string;
  hsnCode: string;
  quantity: number;
  mrp: number;
  discount: number;
  sellingPrice: number;
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  lineTotal: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  orderDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: InvoiceLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  shippingCharge: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  store: {
    name: string;
    address: string;
    gstin: string;
    phone: string;
    email: string;
  };
};

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function InvoiceTemplate({ data, isSample }: { data: InvoiceData; isSample?: boolean }) {
  return (
    <div className="mx-auto max-w-[800px] bg-white p-8 font-sans text-sm text-gray-900" id="invoice-content">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{data.store.name}</h1>
          {data.store.address && <p className="mt-1 text-xs text-gray-500">{data.store.address}</p>}
          {data.store.gstin && <p className="mt-0.5 text-xs text-gray-500">GSTIN: {data.store.gstin}</p>}
          {data.store.phone && <p className="mt-0.5 text-xs text-gray-500">Phone: {data.store.phone}</p>}
          {data.store.email && <p className="mt-0.5 text-xs text-gray-500">Email: {data.store.email}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">TAX INVOICE</p>
          {isSample && (
            <p className="mt-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
              Sample — Not a real invoice
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">Invoice #: <span className="font-medium text-gray-900">{data.invoiceNumber}</span></p>
          <p className="text-xs text-gray-500">Date: {fmtDate(data.invoiceDate)}</p>
          <p className="text-xs text-gray-500">Order #: <span className="font-medium text-gray-900">{data.orderNumber}</span></p>
          <p className="text-xs text-gray-500">Order Date: {fmtDate(data.orderDate)}</p>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bill To</p>
          <p className="mt-2 font-medium">{data.customer.name}</p>
          {data.customer.email && <p className="text-xs text-gray-600">{data.customer.email}</p>}
          {data.customer.phone && <p className="text-xs text-gray-600">{data.customer.phone}</p>}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ship To</p>
          <p className="mt-2 text-xs text-gray-700">{data.shippingAddress.line1}</p>
          {data.shippingAddress.line2 && <p className="text-xs text-gray-700">{data.shippingAddress.line2}</p>}
          <p className="text-xs text-gray-700">
            {data.shippingAddress.city}, {data.shippingAddress.state} — {data.shippingAddress.postalCode}
          </p>
          <p className="text-xs text-gray-700">{data.shippingAddress.country}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="pb-2 text-left">#</th>
              <th className="pb-2 text-left">Item</th>
              <th className="pb-2 text-left">HSN</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">MRP</th>
              <th className="pb-2 text-right">Taxable</th>
              <th className="pb-2 text-right">GST %</th>
              <th className="pb-2 text-right">CGST</th>
              <th className="pb-2 text-right">SGST</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-500">{i + 1}</td>
                <td className="py-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {[item.size, item.color].filter(Boolean).join(" / ")} — SKU: {item.sku}
                  </p>
                </td>
                <td className="py-2 text-gray-600">{item.hsnCode || "—"}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">₹{fmt(item.mrp)}</td>
                <td className="py-2 text-right">₹{fmt(item.taxableValue)}</td>
                <td className="py-2 text-right">{Math.round(item.gstRate * 100)}%</td>
                <td className="py-2 text-right">₹{fmt(item.cgst)}</td>
                <td className="py-2 text-right">₹{fmt(item.sgst)}</td>
                <td className="py-2 text-right font-medium">₹{fmt(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>₹{fmt(data.subtotal)}</span>
          </div>
          {data.totalDiscount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-700">−₹{fmt(data.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Taxable Value</span>
            <span>₹{fmt(data.totalTaxableValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">CGST</span>
            <span>₹{fmt(data.totalCgst)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">SGST</span>
            <span>₹{fmt(data.totalSgst)}</span>
          </div>
          {data.totalIgst > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">IGST</span>
              <span>₹{fmt(data.totalIgst)}</span>
            </div>
          )}
          {data.shippingCharge > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span>₹{fmt(data.shippingCharge)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 pt-2 text-sm font-bold">
            <span>Grand Total</span>
            <span>₹{fmt(data.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment & Footer */}
      <div className="mt-8 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <p>Payment: <span className="font-medium text-gray-700">{data.paymentMethod.toUpperCase()}</span> — <span className={data.paymentStatus === "paid" ? "font-medium text-green-700" : "font-medium text-amber-700"}>{data.paymentStatus.toUpperCase()}</span></p>
          <p>This is a computer-generated invoice.</p>
        </div>
      </div>
    </div>
  );
}

/** Sample invoice data for admin preview */
export function getSampleInvoiceData(storeName?: string): InvoiceData {
  return {
    invoiceNumber: "INV-20262027-SAMPLE",
    invoiceDate: new Date().toISOString(),
    orderNumber: "NS-SAMPLE-12345",
    orderDate: new Date().toISOString(),
    customer: {
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+91 98765 43210",
    },
    shippingAddress: {
      line1: "42, Park Avenue",
      line2: "Jubilee Hills",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500033",
      country: "India",
    },
    items: [
      {
        name: "Ivory Silk Drape Dress",
        sku: "NS-DRP-001",
        size: "M",
        color: "Ivory",
        hsnCode: "6204",
        quantity: 1,
        mrp: 4999,
        discount: 0,
        sellingPrice: 4999,
        gstRate: 0.05,
        taxableValue: 4761.0,
        cgst: 119.0,
        sgst: 119.0,
        igst: 0,
        totalGst: 238.0,
        lineTotal: 4999,
      },
      {
        name: "Black Tailored Blazer",
        sku: "NS-BLZ-003",
        size: "S",
        color: "Black",
        hsnCode: "6204",
        quantity: 2,
        mrp: 3499,
        discount: 0,
        sellingPrice: 3499,
        gstRate: 0.12,
        taxableValue: 6248.21,
        cgst: 374.89,
        sgst: 374.89,
        igst: 0,
        totalGst: 749.79,
        lineTotal: 6998,
      },
    ],
    subtotal: 11997,
    totalDiscount: 0,
    totalTaxableValue: 11009.21,
    totalCgst: 493.89,
    totalSgst: 493.89,
    totalIgst: 0,
    totalGst: 987.79,
    shippingCharge: 0,
    grandTotal: 11997,
    paymentMethod: "razorpay",
    paymentStatus: "paid",
    store: {
      name: storeName ?? "Naya Studio",
      address: "123 Fashion Street, Mumbai, Maharashtra 400001",
      gstin: "27AAAAA0000A1Z5",
      phone: "+91 98765 00000",
      email: "hello@nayastudio.com",
    },
  };
}
