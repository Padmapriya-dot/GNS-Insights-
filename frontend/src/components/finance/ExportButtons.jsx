import { FileSpreadsheet, FileText, FileDown } from "lucide-react";

export default function ExportButtons({ onExcel, onCsv, onPdf, label = "Export" }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {onExcel && (
        <button
          type="button"
          onClick={onExcel}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {label} Excel
        </button>
      )}
      {onCsv && (
        <button
          type="button"
          onClick={onCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          <FileDown className="h-4 w-4" />
          {label} CSV
        </button>
      )}
      {onPdf && (
        <button
          type="button"
          onClick={onPdf}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          <FileText className="h-4 w-4" />
          {label} PDF
        </button>
      )}
    </div>
  );
}
