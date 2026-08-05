import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";

import Loader from "../../components/common/Loader";
import Invoice from "../../components/sales/Invoice";
import { getInvoiceDetail } from "../../api/salesApi";
import { useCompanySettings } from "../../hooks/useCompanySettings";
import { mapDetailToInvoiceCopy } from "../../utils/invoiceCopyData";

/* All Invoice.css rules as a string — injected into the print popup */
const INVOICE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  @page { size: A4 portrait; margin: 8mm; }

  .invoice-page {
    font-family: "Times New Roman", Times, serif;
    font-size: 10px; color: #000; background: #fff;
    width: 210mm; margin: 0 auto; padding: 10mm;
    box-sizing: border-box; border: 1px solid #000;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .invoice-page .invoice-title {
    text-align: center; font-size: 14px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase; margin-bottom: 6px;
  }
  .invoice-page .top-section {
    display: flex; justify-content: space-between; align-items: center;
    gap: 10px; padding-bottom: 6px; margin-bottom: 8px;
  }
  .invoice-page .ack-info { font-size: 9px; line-height: 1.4; }
  .invoice-page .ack-info div { margin-bottom: 3px; }
  .invoice-page .ack-info strong { font-weight: 700; }
  .invoice-page .qr-box {
    display: inline-flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-size: 8.5px; font-weight: 700;
  }
  .invoice-page table { width: 100%; border-collapse: collapse; border-spacing: 0; margin: 0; }
  .invoice-page .meta-table { border: 1px solid #000; }
  .invoice-page .goods-table {
    border-left: 1px solid #000; border-right: 1px solid #000;
    border-bottom: none; border-top: none; margin-top: -1px;
  }
  .invoice-page .tax-table { border: 1px solid #000; border-top: none; margin-top: -1px; }
  .invoice-page .meta-table th, .invoice-page .meta-table td,
  .invoice-page .goods-table th, .invoice-page .goods-table td,
  .invoice-page .tax-table th, .invoice-page .tax-table td {
    border: 1px solid #000; padding: 4px 5px;
    vertical-align: middle; font-size: 9.5px; line-height: 1.25;
  }
  .invoice-page .goods-table th, .invoice-page .goods-table td {
    border-top: none; border-bottom: none; border-left: none; border-right: 1px solid #000;
  }
  .invoice-page .goods-table th:first-child,
  .invoice-page .goods-table td:first-child { border-left: 1px solid #000; }
  .invoice-page .goods-table thead tr th { border-top: 1px solid #000; border-bottom: 1px solid #000; }
  .invoice-page .goods-table tbody tr.goods-total-row td {
    border-top: 1px solid #000; border-bottom: 1px solid #000;
  }
  .invoice-page .meta-table .label,
  .invoice-page .meta-table th.label,
  .invoice-page .meta-table td.label { background: #f4f4f4; font-weight: 700; font-size: 8.8px; }
  .invoice-page .goods-table thead th,
  .invoice-page .tax-table thead th {
    background: #f4f4f4; font-weight: 700; text-align: center; font-size: 9px; padding: 5px 6px;
  }
  .invoice-page .company-cell { border-right: 1px solid #000; padding: 0; }
  .invoice-page .company-box {
    display: flex; gap: 10px; padding: 6px 8px;
    border-bottom: 1px solid #000; background: #fff;
  }
  .invoice-page .logo-box {
    width: 56px; min-width: 56px; height: 52px; border: 1px solid #000;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .invoice-page .logo-img { width: 100%; height: 100%; object-fit: contain; }
  .invoice-page .logo-text {
    font-size: 9px; font-weight: 900; letter-spacing: .04em;
    color: #111; text-align: center; line-height: 1.2;
  }
  .invoice-page .company-details { font-size: 9px; line-height: 1.35; }
  .invoice-page .company-title { font-weight: 700; font-size: 11px; letter-spacing: .04em; margin-bottom: 4px; }
  .invoice-page .description-cell {
    font-weight: 700; text-transform: uppercase; white-space: pre-wrap;
    line-height: 1.15; vertical-align: top; padding: 6px 8px; font-size: 9px; min-height: 34px;
  }
  .invoice-page .goods-table td, .invoice-page .tax-table td { padding: 4px 6px; }
  .invoice-page .goods-table td.text-right, .invoice-page .tax-table td.text-right { text-align: right; }
  .invoice-page .goods-table td.text-center, .invoice-page .tax-table td.text-center { text-align: center; }
  .invoice-page .text-right { text-align: right; }
  .invoice-page .text-left  { text-align: left; }
  .invoice-page .text-center { text-align: center; }
  .invoice-page .bold,
  .invoice-page .goods-table td.bold, .invoice-page .tax-table td.bold,
  .invoice-page .meta-table td.bold, .invoice-page .meta-table th.bold { font-weight: 700; }
  .invoice-page .amount-word {
    border-left: 1px solid #000; border-right: 1px solid #000;
    border-bottom: 1px solid #000; border-top: none; margin-top: -1px;
    padding: 5px 7px 6px; font-size: 9.2px; line-height: 1.35;
  }
  .invoice-page .amount-word .amount-label {
    font-weight: 700; font-size: 9px; text-transform: uppercase;
    letter-spacing: .02em; margin-bottom: 3px;
  }
  .invoice-page .amount-word .amount-text { font-size: 9.2px; line-height: 1.4; }
  .invoice-page .bottom-note {
    margin-top: 8px; text-align: center; font-size: 8.3px;
    color: #444; font-style: italic; padding-top: 6px; letter-spacing: .01em;
  }
`;

export default function InvoiceCopyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useCompanySettings();
  const [loading, setLoading] = useState(Boolean(id));
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, left: 0 });
    getInvoiceDetail(id)
      .then((r) => { setDetail(r.data); setError(null); })
      .catch((err) => { console.error(err); setError(err); })
      .finally(() => setLoading(false));
  }, [id]);

  const copyData = useMemo(() => {
    return id ? mapDetailToInvoiceCopy(detail, settings || {}) : null;
  }, [id, detail, settings]);

  /* ── Download PDF: html2canvas captures the exact rendered invoice ── */
  const handleDownload = async () => {
    if (!invoiceRef.current || !copyData) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const el = invoiceRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      // Multi-page support if invoice is taller than one A4 page
      let yOffset = 0;
      let pageIndex = 0;
      while (yOffset < imgH) {
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, pageW, imgH);
        yOffset += pageH;
        pageIndex++;
      }

      const invoiceNo = copyData?.meta?.invoiceNo || "invoice";
      pdf.save(`${invoiceNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  /* ── Print: open popup with hardcoded CSS + cloned invoice HTML ── */
  const handlePrint = () => {
    if (!invoiceRef.current || !copyData) return;

    const el = invoiceRef.current;

    // Clone and replace every <canvas> (QR) with a static <img>
    const clone = el.cloneNode(true);
    el.querySelectorAll("canvas").forEach((src, i) => {
      const target = clone.querySelectorAll("canvas")[i];
      if (!target) return;
      const img = document.createElement("img");
      img.src = src.toDataURL();
      img.style.cssText = `width:${src.offsetWidth}px;height:${src.offsetHeight}px;display:block;`;
      target.replaceWith(img);
    });

    const win = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
    if (!win) {
      alert("Popup blocked. Please allow popups for this site and try again.");
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${copyData?.meta?.invoiceNo || ""}</title>
  <style>${INVOICE_CSS}</style>
</head>
<body>
  ${clone.outerHTML}
  <script>
    window.onload = function () {
      // Wait for fonts + images to settle
      setTimeout(function () { window.print(); }, 500);
    };
  <\/script>
</body>
</html>`);
    win.document.close();
  };

  if (loading) return <Loader label="Loading invoice..." />;

  if (error) {
    const message = error.response?.data?.message || error.response?.statusText || error.message || "Unable to load invoice.";
    return (
      <div className="space-y-4 pb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <div className="text-lg font-semibold text-slate-700">Invoice load failed</div>
          <div className="mt-2">{message}</div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!copyData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice preview */}
      {copyData ? (
        <div ref={invoiceRef}>
          <Invoice data={copyData} />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Select an invoice to view its full details.
        </div>
      )}
    </div>
  );
}
