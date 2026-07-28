import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { numberToWordsInr } from "../../utils/invoiceCopyData";
import "./Invoice.css";

/* ── QR canvas ─────────────────────────────────────────────── */
function QRCanvas({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, { width: 70, margin: 1, errorCorrectionLevel: "M" }, () => {});
  }, [value]);
  return <canvas ref={ref} />;
}

/* ═══════════════════════════════════════════════════════════════
   Invoice  –  accepts a `data` prop (same shape as TaxInvoiceCopy)
   ═══════════════════════════════════════════════════════════════ */
export default function Invoice({ data }) {
  if (!data) return null;

  /* ── seller ── */
  const sName  = data.seller?.name    || "GNS INSIGHTS PRIVATE LIMITED";
  const sAddr  = data.seller?.address || "Hyderabad, Telangana";
  const sGstin = data.seller?.gstin   || "";
  const sState = data.seller?.state   || "Telangana";
  const sEmail = data.seller?.email   || "";
  const sCin   = data.seller?.cin     || "";
  const sUdyam = data.seller?.udyam   || "";

  /* ── meta ── */
  const invoiceNo = data.meta?.invoiceNo  || "";
  const date      = data.meta?.date       || "";
  const irn       = data.irn  && data.irn  !== "—" ? data.irn  : "";
  const ackNo     = data.ackNo && data.ackNo !== "—" ? data.ackNo : "";
  const ackDate   = data.ackDate || date;

  /* ── buyer / consignee ── */
  const consigneeName  = data.consignee?.name    || data.buyer?.name    || "";
  const consigneeAddr  = data.consignee?.address || data.buyer?.address || "";
  const consigneeGstin = data.consignee?.gstin   || data.buyer?.gstin   || "";
  const buyerName      = data.buyer?.name    || "";
  const buyerAddr      = data.buyer?.address || "";
  const buyerGstin     = data.buyer?.gstin   || "";

  /* ── tax calculations ── */
  const items    = data.items || [];
  const taxable  = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const qtyTotal = items.reduce((s, it) => s + parseFloat(it.qty   || 0), 0);
  const unit0    = items[0]?.unit || "PCS";

  const taxValue = (obj, camelKey, snakeKey) => Number(obj?.[camelKey] ?? obj?.[snakeKey]) || 0;

  const invoiceIgstPct = taxValue(data, "igstPct", "igst_pct") || (items.length === 1 ? taxValue(items[0], "igstPct", "igst_pct") : 0);
  const invoiceCgstPct = taxValue(data, "cgstPct", "cgst_pct") || (items.length === 1 ? taxValue(items[0], "cgstPct", "cgst_pct") : 0);
  const invoiceSgstPct = taxValue(data, "sgstPct", "sgst_pct") || (items.length === 1 ? taxValue(items[0], "sgstPct", "sgst_pct") : 0);

  const itemHasCgstSgst = items.some((item) =>
    taxValue(item, "cgstPct", "cgst_pct") > 0 ||
    taxValue(item, "sgstPct", "sgst_pct") > 0 ||
    Number(item.cgst_amount) > 0 ||
    Number(item.cgstAmount) > 0 ||
    Number(item.sgst_amount) > 0 ||
    Number(item.sgstAmount) > 0
  );

  const itemHasIgst = items.some((item) =>
    taxValue(item, "igstPct", "igst_pct") > 0 ||
    Number(item.igst_amount) > 0 ||
    Number(item.igstAmount) > 0
  );

  const hasCgstSgst = Boolean(
    invoiceCgstPct || invoiceSgstPct ||
    Number(data.cgst_amount) || Number(data.cgstAmount) ||
    Number(data.sgst_amount) || Number(data.sgstAmount) ||
    itemHasCgstSgst
  );

  const isIgst = !hasCgstSgst && Boolean(
    invoiceIgstPct ||
    Number(data.igst_amount) || Number(data.igstAmount) ||
    itemHasIgst
  );

  const igstPct  = invoiceIgstPct || 18;
  const igstAmt  = isIgst ? (Number(data.igst_amount) || Number(data.igstAmount) || Math.round(taxable * igstPct / 100 * 100) / 100) : 0;
  const cgstAmt  = hasCgstSgst ? (Number(data.cgst_amount) || Number(data.cgstAmount) || Math.round(taxable * invoiceCgstPct / 100 * 100) / 100) : 0;
  const sgstAmt  = hasCgstSgst ? (Number(data.sgst_amount) || Number(data.sgstAmount) || Math.round(taxable * invoiceSgstPct / 100 * 100) / 100) : 0;
  const totalTax = isIgst ? igstAmt : cgstAmt + sgstAmt;
  const roundOff = Number(data.roundOff) || 0;
  const grand    = Number(data.grandTotal) || taxable + totalTax + roundOff;
  const fmt      = (n, d = 2) => Number(n).toFixed(d);

  /* ── QR payload ── */
  const qrValue = [
    `Seller:${sName}`, `GSTIN:${sGstin}`,
    `Invoice:${invoiceNo}`, `Date:${date}`,
    `Buyer:${buyerName}`, `BuyerGSTIN:${buyerGstin}`,
    `Total:${grand}`,
    irn ? `IRN:${irn}` : "",
  ].filter(Boolean).join("|");

  return (
    <div className="invoice-page">

      {/* ── TITLE ─────────────────────────────────────────── */}
      <div className="invoice-title">Tax Invoice</div>

      {/* ── TOP: ACK / IRN info  |  e-Invoice QR ─────────── */}
      <div className="top-section">
        <div className="ack-info">
          <div><strong>IRN :</strong> <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{irn || ""}</span></div>
          <div><strong>Ack No :</strong> {ackNo || ""}</div>
          <div><strong>Ack Date :</strong> {ackDate || ""}</div>
        </div>
        <div className="qr-box">
          <div style={{ marginBottom: 3, fontSize: 9, fontWeight: 600 }}>e-Invoice</div>
          <div style={{ border: "1px solid #000", padding: 3, display: "inline-block", lineHeight: 0 }}>
            {qrValue ? <QRCanvas value={qrValue} /> : (
              <div style={{ width: 70, height: 70, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, background: "#f8f8f8" }}>QR</div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION A — LEFT: GNS + Consignee + Buyer  |  RIGHT: Meta grid */}
      <table className="meta-table">
        <tbody>

          {/* Row 1 — LEFT spans all 7 rows */}
          <tr>
            <td rowSpan="7" className="company-cell" style={{ width: "42%", padding: 0, verticalAlign: "top" }}>

              {/* GNS company info */}
              <div className="company-box">
                <div className="logo-box">
                  {data.seller?.logo
                    ? <img src={data.seller.logo} alt="logo" className="logo-img" />
                    : <span className="logo-text">LOGO</span>
                  }
                </div>
                <div className="company-details">
                  <div className="company-title">{sName}</div>
                  {sUdyam && <div>{sUdyam}</div>}
                  <div>{sAddr}</div>
                  <div><strong>GSTIN/UIN:</strong> {sGstin || "—"}</div>
                  <div><strong>State Name :</strong> {sState}</div>
                  {sCin   && <div><strong>CIN :</strong> {sCin}</div>}
                  {sEmail && <div><strong>E-Mail :</strong> {sEmail}</div>}
                </div>
              </div>

              {/* Consignee (Ship to) */}
              <div style={{ padding: "4px 8px", borderBottom: "1px solid #000" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#555", marginBottom: 2 }}>Consignee (Ship to)</div>
                {consigneeName && <div className="bold">{consigneeName}</div>}
                {consigneeAddr && <div style={{ whiteSpace: "pre-wrap" }}>{consigneeAddr}</div>}
                <div><strong>GSTIN/UIN :</strong> {consigneeGstin || "—"}</div>
              </div>

              {/* Buyer (Bill to) */}
              <div style={{ padding: "4px 8px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#555", marginBottom: 2 }}>Buyer (Bill to)</div>
                {buyerName && <div className="bold">{buyerName}</div>}
                {buyerAddr && <div style={{ whiteSpace: "pre-wrap" }}>{buyerAddr}</div>}
                <div><strong>GSTIN/UIN :</strong> {buyerGstin || "—"}</div>
                {data.buyer?.state && <div><strong>State Name :</strong> {data.buyer.state}</div>}
              </div>

            </td>

            {/* RIGHT — meta row 1 */}
            <td className="label" style={{ width: "14%" }}>Invoice No.</td>
            <td style={{ width: "16%" }} className="bold">{invoiceNo || "—"}</td>
            <td className="label" style={{ width: "14%" }}>Dated</td>
            <td style={{ width: "14%" }}>{date || "—"}</td>
          </tr>

          <tr>
            <td className="label">Delivery Note</td>
            <td>{data.meta?.deliveryNote || ""}</td>
            <td className="label">Mode/Terms</td>
            <td>{data.meta?.modeTerms || ""}</td>
          </tr>

          <tr>
            <td className="label">Reference No.</td>
            <td>{data.meta?.referenceNo || ""}</td>
            <td className="label">Other Reference</td>
            <td>{data.meta?.otherRef || ""}</td>
          </tr>

          <tr>
            <td className="label">Buyer's Order No.</td>
            <td>{data.meta?.buyersOrderNo || ""}</td>
            <td className="label">Dated</td>
            <td>{data.meta?.buyerOrderDate || ""}</td>
          </tr>

          <tr>
            <td className="label">Dispatch Doc No.</td>
            <td>{data.meta?.dispatchDocNo || ""}</td>
            <td className="label">Delivery Date</td>
            <td>{data.meta?.deliveryDate || ""}</td>
          </tr>

          <tr>
            <td className="label">Dispatched Through</td>
            <td>{data.meta?.dispatchedThrough || ""}</td>
            <td className="label">Destination</td>
            <td>{data.meta?.destination || ""}</td>
          </tr>

          <tr>
            <td colSpan="2" className="label">Terms of Delivery</td>
            <td colSpan="2">{data.meta?.termsOfDelivery || ""}</td>
          </tr>

        </tbody>
      </table>

      {/* ══════════════════════════════════════════════════════
          SECTION B — Goods / Items Table
          ══════════════════════════════════════════════════════ */}
      <table className="goods-table">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>Sl No</th>
            <th style={{ width: "36%", textAlign: "left" }}>Description of Goods</th>
            <th style={{ width: "10%" }}>HSN/SAC</th>
            <th style={{ width: "10%" }}>Qty</th>
            <th style={{ width: "10%" }}>Rate</th>
            <th style={{ width: "7%" }}>Per</th>
            <th style={{ width: "14%", textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>

          {/* Item rows */}
          {items.map((item, idx) => (
            <tr key={item.si || idx}>
              <td className="text-center">{item.si || idx + 1}</td>
              <td>{item.description || item.item_description || ""}</td>
              <td className="text-center" style={{ fontFamily: "monospace" }}>{item.hsn || ""}</td>
              <td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(item.qty)}</td>
              <td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(item.rate)}</td>
              <td className="text-center">{item.unit || unit0}</td>
              <td className="text-right bold" style={{ fontFamily: "monospace" }}>{fmt(item.amount)}</td>
            </tr>
          ))}

          {/* Tax rows — one row per tax type so each % aligns with its label */}
          {isIgst ? (
            <tr>
              <td />
              <td className="text-right">IGST</td>
              <td /><td /><td />
              <td className="text-center" style={{ fontFamily: "monospace" }}>{igstPct}%</td>
              <td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(igstAmt)}</td>
            </tr>
          ) : (
            <>
              <tr>
                <td />
                <td className="text-right">CGST</td>
                <td /><td /><td />
                <td className="text-center" style={{ fontFamily: "monospace" }}>{invoiceCgstPct}%</td>
                <td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(cgstAmt)}</td>
              </tr>
              <tr>
                <td />
                <td className="text-right">SGST</td>
                <td /><td /><td />
                <td className="text-center" style={{ fontFamily: "monospace" }}>{invoiceSgstPct}%</td>
                <td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(sgstAmt)}</td>
              </tr>
            </>
          )}

          {roundOff !== 0 && (
            <tr>
              <td />
              <td className="text-right">Rounded Off</td>
              <td /><td /><td /><td />
              <td className="text-right" style={{ fontFamily: "monospace" }}>
                {roundOff > 0 ? "+" : ""}{fmt(roundOff)}
              </td>
            </tr>
          )}

          {/* Total row */}
          <tr>
            <td colSpan="3" className="text-right bold">Total</td>
            <td className="text-right bold" style={{ fontFamily: "monospace" }}>{fmt(qtyTotal)}</td>
            <td colSpan="2" />
            <td className="text-right bold" style={{ fontFamily: "monospace" }}>₹ {fmt(grand)}</td>
          </tr>

        </tbody>
      </table>

      {/* ── Amount in words ─────────────────────────────────── */}
      <div className="amount-word">
        <div className="bold">Amount Chargeable (in words)</div>
        <div style={{ textTransform: "uppercase", marginTop: 2 }}>
          {numberToWordsInr ? numberToWordsInr(grand) : `INR ${grand}`}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION C — HSN / Tax Summary Table
          ══════════════════════════════════════════════════════ */}
      <table className="tax-table">
        <thead>
          <tr>
            <th rowSpan="2" style={{ width: "28%" }}>HSN/SAC</th>
            <th rowSpan="2" style={{ width: "16%" }}>Taxable Value</th>
            {isIgst
              ? <th colSpan="2">IGST</th>
              : <><th colSpan="2">CGST</th><th colSpan="2">SGST</th></>}
            <th rowSpan="2" style={{ width: "16%" }}>Total Tax Amount</th>
          </tr>
          <tr>
            {isIgst
              ? <><th>Rate</th><th>Amount</th></>
              : <><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></>}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{items[0]?.hsn || "—"}</td>
            <td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(taxable)}</td>
            {isIgst
              ? <><td className="text-right" style={{ fontFamily: "monospace" }}>{igstPct}%</td><td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(igstAmt)}</td></>
              : <><td className="text-right" style={{ fontFamily: "monospace" }}>{invoiceCgstPct}%</td><td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(cgstAmt)}</td>
                 <td className="text-right" style={{ fontFamily: "monospace" }}>{invoiceSgstPct}%</td><td className="text-right" style={{ fontFamily: "monospace" }}>{fmt(sgstAmt)}</td></>}
            <td className="text-right bold" style={{ fontFamily: "monospace" }}>{fmt(totalTax)}</td>
          </tr>
          <tr>
            <td className="text-right bold">Total</td>
            <td className="text-right bold" style={{ fontFamily: "monospace" }}>{fmt(taxable)}</td>
            {isIgst
              ? <><td /><td className="text-right bold" style={{ fontFamily: "monospace" }}>{fmt(igstAmt)}</td></>
              : <><td /><td className="text-right bold" style={{ fontFamily: "monospace" }}>{fmt(cgstAmt)}</td>
                 <td /><td className="text-right bold" style={{ fontFamily: "monospace" }}>{fmt(sgstAmt)}</td></>}
            <td className="text-right bold" style={{ fontFamily: "monospace" }}>{fmt(totalTax)}</td>
          </tr>
        </tbody>
      </table>

      {/* Tax amount in words */}
      <div style={{ border: "1px solid #000", borderTop: "none", padding: "3px 8px", fontSize: 9.5 }}>
        <span style={{ color: "#444" }}>Tax Amount (in words) : </span>
        <strong>{numberToWordsInr ? numberToWordsInr(totalTax) : `INR ${totalTax}`}</strong>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION D — Declaration (left) | Rejection Policy + Signatory (right)
          ══════════════════════════════════════════════════════ */}
      <div className="footer-box">

        {/* LEFT — Declaration */}
        <div className="footer-left">
          <div className="bold" style={{ textDecoration: "underline", marginBottom: 4 }}>Declaration</div>
          <ol className="small" style={{ paddingLeft: 14, margin: 0, lineHeight: 1.6 }}>
            <li>Certified that the particulars given above are true and correct.</li>
            <li>The amount indicated represents the price actually charged and there is no flow of additional consideration directly or indirectly from the Buyer.</li>
            <li>All disputes subject to jurisdiction.</li>
            <li>Goods once sold cannot be taken back or exchanged.</li>
            <li>Cheques subject to realization.</li>
            <li>24% interest per annum will be charged if bills are not paid within due days.</li>
            <li>Goods Return Policy: Goods shall be taken back only within 7 days.</li>
          </ol>
          {data.remarks && (
            <div className="small mt10" style={{ borderTop: "1px solid #ccc", paddingTop: 3 }}>
              <strong>Remarks: </strong>{data.remarks}
            </div>
          )}
        </div>

        {/* RIGHT — Rejection Policy + Signatory */}
        <div className="footer-right">
          <div>
            <div className="bold" style={{ textDecoration: "underline", marginBottom: 4 }}>Rejection Policy</div>
            <ol className="small" style={{ paddingLeft: 14, margin: 0, lineHeight: 1.6 }}>
              <li>Loose Winding &amp; Tight Release.</li>
              <li>Printability on face paper.</li>
              <li>Loop Tack, Peel Adhesion and Shear Strength (15% clearance) are less than what is mentioned in our Technical Data Sheet.</li>
              <li>For all Rejection and Quality Claims: End user Email / Samples for evaluation is mandatory.</li>
              <li>For application issues End user visit by company representative/technical team is mandatory.</li>
              <li>No rejection claim will be accepted if above conditions are not fulfilled.</li>
              <li>Quality discrepancies/shortages to be reported within 24 hours from receipt of material.</li>
              <li>Any quality issue claims can only be accepted within 7 days.</li>
            </ol>
          </div>

          <div style={{ textAlign: "right", marginTop: 6 }}>
            <div className="bold small">for {sName}</div>
            <div style={{ marginTop: 28, fontSize: 9, fontWeight: 700, color: "#444" }}>Authorised Signatory</div>
          </div>
        </div>

      </div>

      {/* ── Bottom signatory row ─────────────────────────── */}
      <div className="sign-section">
        <div>Prepared by</div>
        <div>Verified by</div>
        <div>for {sName}</div>
      </div>

      {/* ── Computer generated note ──────────────────────── */}
      <div className="bottom-note">This is a Computer Generated Invoice</div>

    </div>
  );
}
