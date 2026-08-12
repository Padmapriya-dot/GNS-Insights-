import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { numberToWordsInr } from "../../utils/invoiceCopyData";
import "./GstTaxInvoice.css";

function QRCanvas({ value, size = 80 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, { width: size, margin: 1, errorCorrectionLevel: "M" }, () => {});
  }, [value, size]);
  return <canvas ref={ref} aria-label="E-Invoice QR code" />;
}

function fmt(n, d = 2) {
  return Number(n || 0).toFixed(d);
}

function fmtInr(n) {
  return `₹ ${fmt(n)}`;
}

/**
 * Enterprise GST Tax Invoice — original Insights Iva layout.
 * Accepts unified `data` from mapDetailToInvoiceCopy / backend /document API.
 */
export default function GstTaxInvoice({ data }) {
  if (!data) return null;

  const seller = data.seller || {};
  const meta = data.meta || {};
  const buyer = data.buyer || {};
  const consignee = data.consignee || buyer;
  const dispatch = data.dispatch || {};
  const items = data.items || [];
  const summary = data.summary || {};
  const payment = data.payment || {};
  const taxMode = data.tax_mode || data.taxMode || (data.isIgst ? "igst" : "cgst_sgst");
  const isIgst = taxMode === "igst";

  const taxable = summary.taxable_value ?? summary.taxableTotal ?? items.reduce((s, it) => s + Number(it.taxable_amount ?? it.amount ?? 0), 0);
  const cgstTotal = summary.cgst_total ?? summary.cgstTotal ?? Number(data.cgst_amount ?? data.cgstAmount ?? 0);
  const sgstTotal = summary.sgst_total ?? summary.sgstTotal ?? Number(data.sgst_amount ?? data.sgstAmount ?? 0);
  const igstTotal = summary.igst_total ?? summary.igstTotal ?? Number(data.igst_amount ?? data.igstAmount ?? 0);
  const roundOff = summary.round_off ?? data.roundOff ?? 0;
  const grand = summary.grand_total ?? data.grandTotal ?? taxable + cgstTotal + sgstTotal + igstTotal + roundOff;
  const qtyTotal = summary.qty_total ?? items.reduce((s, it) => s + parseFloat(it.qty || 0), 0);

  const qrValue = [
    `Seller:${seller.name}`,
    seller.gstin ? `GSTIN:${seller.gstin}` : "",
    meta.invoice_no || meta.invoiceNo ? `Invoice:${meta.invoice_no || meta.invoiceNo}` : "",
    meta.date ? `Date:${meta.date}` : "",
    buyer.name ? `Buyer:${buyer.name}` : "",
    buyer.gstin ? `BuyerGSTIN:${buyer.gstin}` : "",
    `Total:${grand}`,
    data.irn && data.irn !== "—" ? `IRN:${data.irn}` : "",
  ].filter(Boolean).join("|");

  const terms = (data.terms || data.termsAndConditions || "").split("\n").filter(Boolean);
  const defaultTerms = [
    "Payment due within agreed credit period.",
    "Goods once sold will not be taken back except per return policy.",
    "Interest @ 18% p.a. on overdue invoices.",
    "All disputes subject to local jurisdiction.",
  ];

  return (
    <article className="gst-invoice" aria-label="GST Tax Invoice">
      {/* Header band */}
      <header className="gst-invoice__header">
        <div className="gst-invoice__brand">
          <div className="gst-invoice__logo">
            {seller.logo ? (
              <img src={seller.logo} alt={`${seller.name} logo`} />
            ) : (
              <span className="gst-invoice__logo-fallback">GNS</span>
            )}
          </div>
          <div>
            <h1 className="gst-invoice__company">{seller.name}</h1>
            {seller.tagline ? <p className="gst-invoice__tagline">{seller.tagline}</p> : null}
            <p className="gst-invoice__address">{seller.address}</p>
            <div className="gst-invoice__ids">
              {seller.gstin ? <span>GSTIN: {seller.gstin}</span> : null}
              {seller.pan ? <span>PAN: {seller.pan}</span> : null}
              {seller.cin ? <span>CIN: {seller.cin}</span> : null}
            </div>
            <div className="gst-invoice__contact">
              {seller.phone ? <span>📞 {seller.phone}</span> : null}
              {seller.email ? <span>✉ {seller.email}</span> : null}
              {seller.website ? <span>🌐 {seller.website}</span> : null}
            </div>
          </div>
        </div>
        <div className="gst-invoice__title-block">
          <h2 className="gst-invoice__title">{data.title || "TAX INVOICE"}</h2>
          {(data.eInvoice || data.e_invoice_enabled) && (
            <div className="gst-invoice__einvoice">
              <span className="gst-invoice__einvoice-label">e-Invoice Ready</span>
              <div className="gst-invoice__qr-wrap">
                {qrValue ? <QRCanvas value={qrValue} /> : <div className="gst-invoice__qr-placeholder">QR</div>}
              </div>
              {data.irn && data.irn !== "—" ? (
                <p className="gst-invoice__irn"><strong>IRN:</strong> {data.irn}</p>
              ) : null}
            </div>
          )}
        </div>
      </header>

      {/* Invoice meta + parties */}
      <section className="gst-invoice__grid gst-invoice__meta-grid">
        <div className="gst-invoice__card">
          <h3>Invoice Details</h3>
          <dl>
            <div><dt>Invoice No.</dt><dd>{meta.invoice_no || meta.invoiceNo || "—"}</dd></div>
            <div><dt>Invoice Date</dt><dd>{meta.date || "—"}</dd></div>
            <div><dt>Due Date</dt><dd>{meta.due_date || meta.dueDate || "—"}</dd></div>
            <div><dt>Reference No.</dt><dd>{meta.reference_no || meta.referenceNo || "—"}</dd></div>
            <div><dt>Delivery Note</dt><dd>{meta.delivery_note || meta.deliveryNote || "—"}</dd></div>
            <div><dt>E-Way Bill</dt><dd>{meta.eway_bill_no || meta.eWayBillNo || "—"}</dd></div>
            <div><dt>Place of Supply</dt><dd>{buyer.place_of_supply || buyer.placeOfSupply || "—"}</dd></div>
          </dl>
        </div>
        <div className="gst-invoice__card">
          <h3>Bill To</h3>
          <p className="gst-invoice__party-name">{buyer.name}</p>
          {buyer.company ? <p>{buyer.company}</p> : null}
          <p>{buyer.billing_address || buyer.address}</p>
          {buyer.gstin ? <p>GSTIN: {buyer.gstin}</p> : null}
          {buyer.state ? <p>State: {buyer.state} {buyer.state_code ? `(${buyer.state_code})` : ""}</p> : null}
          {buyer.phone || buyer.contact ? <p>Contact: {buyer.phone || buyer.contact}</p> : null}
        </div>
        <div className="gst-invoice__card">
          <h3>Ship To</h3>
          <p className="gst-invoice__party-name">{consignee.name || buyer.name}</p>
          <p>{consignee.address || buyer.shipping_address || buyer.billing_address || buyer.address}</p>
          {consignee.gstin || buyer.gstin ? <p>GSTIN: {consignee.gstin || buyer.gstin}</p> : null}
          {consignee.state || buyer.state ? (
            <p>State: {consignee.state || buyer.state} {(consignee.state_code || buyer.state_code) ? `(${consignee.state_code || buyer.state_code})` : ""}</p>
          ) : null}
        </div>
        <div className="gst-invoice__card">
          <h3>Dispatch Details</h3>
          <dl>
            <div><dt>Vehicle No.</dt><dd>{dispatch.vehicle_no || dispatch.vehicleNo || "—"}</dd></div>
            <div><dt>Transport</dt><dd>{dispatch.transport_name || dispatch.transportName || "—"}</dd></div>
            <div><dt>LR Number</dt><dd>{dispatch.lr_number || dispatch.lrNumber || "—"}</dd></div>
            <div><dt>Dispatched Through</dt><dd>{dispatch.dispatch_through || dispatch.dispatchThrough || "—"}</dd></div>
            <div><dt>Destination</dt><dd>{dispatch.destination || "—"}</dd></div>
            <div><dt>Delivery Terms</dt><dd>{dispatch.delivery_terms || dispatch.deliveryTerms || "—"}</dd></div>
          </dl>
        </div>
      </section>

      {/* Line items */}
      <section className="gst-invoice__table-wrap">
        <table className="gst-invoice__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product / Description</th>
              <th>HSN/SAC</th>
              <th>Batch</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Disc.</th>
              <th>Taxable</th>
              {!isIgst ? <><th>CGST%</th><th>SGST%</th></> : <th>IGST%</th>}
              <th>GST Amt</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.si || idx}>
                <td>{item.si || idx + 1}</td>
                <td className="gst-invoice__desc">
                  {item.product_code ? <span className="gst-invoice__code">{item.product_code}</span> : null}
                  {item.description || item.item_description}
                </td>
                <td>{item.hsn || "—"}</td>
                <td>{item.batch || item.batch_lot || "—"}</td>
                <td className="num">{fmt(item.qty)}</td>
                <td>{item.unit || "PCS"}</td>
                <td className="num">{fmt(item.rate, 2)}</td>
                <td className="num">{fmt(item.discount || 0)}</td>
                <td className="num">{fmt(item.taxable_amount ?? item.amount)}</td>
                {!isIgst ? (
                  <>
                    <td className="num">{fmt(item.cgst_pct ?? item.cgstPct ?? 0, 1)}</td>
                    <td className="num">{fmt(item.sgst_pct ?? item.sgstPct ?? 0, 1)}</td>
                  </>
                ) : (
                  <td className="num">{fmt(item.igst_pct ?? item.igstPct ?? 0, 1)}</td>
                )}
                <td className="num">{fmt(item.gst_amount ?? item.gstAmount ?? 0)}</td>
                <td className="num bold">{fmt(item.total_amount ?? item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Summary row */}
      <section className="gst-invoice__summary-row">
        <div className="gst-invoice__words">
          <p><strong>Amount in words:</strong></p>
          <p className="gst-invoice__words-text">{numberToWordsInr(grand)}</p>
          {data.remarks ? <p className="gst-invoice__remarks"><strong>Remarks:</strong> {data.remarks}</p> : null}
        </div>
        <table className="gst-invoice__totals">
          <tbody>
            <tr><td>Total Quantity</td><td>{fmt(qtyTotal)}</td></tr>
            <tr><td>Taxable Value</td><td>{fmtInr(taxable)}</td></tr>
            {!isIgst ? (
              <>
                <tr><td>CGST Total</td><td>{fmtInr(cgstTotal)}</td></tr>
                <tr><td>SGST Total</td><td>{fmtInr(sgstTotal)}</td></tr>
              </>
            ) : (
              <tr><td>IGST Total</td><td>{fmtInr(igstTotal)}</td></tr>
            )}
            {roundOff !== 0 ? (
              <tr><td>Round Off</td><td>{roundOff > 0 ? "+" : ""}{fmtInr(roundOff)}</td></tr>
            ) : null}
            <tr className="gst-invoice__grand"><td>Grand Total</td><td>{fmtInr(grand)}</td></tr>
          </tbody>
        </table>
      </section>

      {/* HSN tax summary */}
      <section className="gst-invoice__hsn-wrap">
        <table className="gst-invoice__hsn-table">
          <thead>
            <tr>
              <th>HSN/SAC</th>
              <th>Taxable Value</th>
              {!isIgst ? <><th>CGST</th><th>SGST</th></> : <th>IGST</th>}
              <th>Total Tax</th>
            </tr>
          </thead>
          <tbody>
            {(items.length ? items : [{ hsn: "—", taxable_amount: taxable }]).map((item, i) => {
              const lineTax = isIgst
                ? (item.igst_amount ?? item.igstAmount ?? 0)
                : (Number(item.cgst_amount ?? item.cgstAmount ?? 0) + Number(item.sgst_amount ?? item.sgstAmount ?? 0));
              return (
                <tr key={i}>
                  <td>{item.hsn || "—"}</td>
                  <td className="num">{fmt(item.taxable_amount ?? item.amount ?? taxable)}</td>
                  {!isIgst ? (
                    <>
                      <td className="num">{fmt(item.cgst_amount ?? item.cgstAmount ?? cgstTotal / Math.max(items.length, 1))}</td>
                      <td className="num">{fmt(item.sgst_amount ?? item.sgstAmount ?? sgstTotal / Math.max(items.length, 1))}</td>
                    </>
                  ) : (
                    <td className="num">{fmt(item.igst_amount ?? item.igstAmount ?? igstTotal)}</td>
                  )}
                  <td className="num bold">{fmt(lineTax || (isIgst ? igstTotal : cgstTotal + sgstTotal))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="gst-invoice__tax-words">
          <strong>Tax amount in words:</strong> {numberToWordsInr(isIgst ? igstTotal : cgstTotal + sgstTotal)}
        </p>
      </section>

      {/* Payment + terms */}
      <section className="gst-invoice__footer-grid">
        <div className="gst-invoice__card">
          <h3>Payment Details</h3>
          <dl>
            <div><dt>Payment Terms</dt><dd>{payment.terms || meta.payment_terms || "—"}</dd></div>
            <div><dt>Advance Received</dt><dd>{fmtInr(payment.advance_received ?? summary.amount_paid ?? 0)}</dd></div>
            <div><dt>Balance Due</dt><dd>{fmtInr(payment.balance_due ?? summary.balance_due ?? grand)}</dd></div>
            <div><dt>Bank</dt><dd>{payment.bank_name || "—"}</dd></div>
            <div><dt>Account No.</dt><dd>{payment.account_number || "—"}</dd></div>
            <div><dt>IFSC</dt><dd>{payment.ifsc || "—"}</dd></div>
          </dl>
        </div>
        <div className="gst-invoice__card gst-invoice__terms">
          <h3>Terms &amp; Conditions</h3>
          <ol>{(terms.length ? terms : defaultTerms).map((t, i) => <li key={i}>{t.replace(/^\d+\.\s*/, "")}</li>)}</ol>
        </div>
      </section>

      {/* Signatures */}
      <footer className="gst-invoice__signatures">
        <div><span>Prepared by</span><strong>{data.prepared_by || data.preparedBy || "___________"}</strong></div>
        <div><span>Checked by</span><strong>{data.checked_by || data.checkedBy || "___________"}</strong></div>
        <div className="gst-invoice__signatory">
          <span>for {seller.name}</span>
          <div className="gst-invoice__sign-line">Authorised Signatory</div>
        </div>
      </footer>
      <p className="gst-invoice__disclaimer">This is a Computer Generated Invoice</p>
    </article>
  );
}
