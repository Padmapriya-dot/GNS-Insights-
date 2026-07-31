export const REPORT_CATALOG = [
  { id: "product-wise-sales", label: "Product Wise Sales Report", color: "#78716c" },
  { id: "product-wise-purchase", label: "Product Wise Purchase Report", color: "#64748b" },
  { id: "party-wise-sales", label: "Party Wise Sales Report", color: "#78716c" },
  { id: "party-wise-purchase", label: "Party Wise Purchase Report", color: "#64748b" },
  { id: "gst-sales", label: "GST Sales Report", color: "#78716c" },
  { id: "gst-purchase", label: "GST Purchase Report", color: "#64748b" },
  { id: "gstr-1", label: "GSTR-1", color: "#2f855a" },
  { id: "gstr-2", label: "GSTR-2", color: "#1e3a8a" },
  { id: "hsn-sales", label: "HSN Sales Report", color: "#1e3a8a" },
  { id: "delivery-challan", label: "Delivery Challan Report", color: "#4c5a87" },
  { id: "bulk-export", label: "Bulk Export", color: "#5b4b8a" },
  { id: "invoice-details", label: "Invoice Details Report", color: "#0ea5e9" },
  { id: "purchase-details", label: "Purchase Details Report", color: "#d97706" },
  { id: "tds-payable", label: "TDS Summary Payable", color: "#93c5fd" },
  { id: "tds-receivable", label: "TDS Summary Receivable", color: "#93c5fd" },
  { id: "current-stock", label: "Current Stock Report", color: "#a16207" },
  { id: "delivery-challan-details", label: "Delivery Challan Details Report", color: "#94a3b8" },
  { id: "audit-trail", label: "Audit Trail", color: "#64748b" },
  { id: "balance-sheet", label: "Balance Sheet", color: "#f59e0b" },
  { id: "profit-loss", label: "Profit and Loss Report", color: "#f59e0b" },
];

export function getReportById(id) {
  return REPORT_CATALOG.find((r) => r.id === id) || null;
}
