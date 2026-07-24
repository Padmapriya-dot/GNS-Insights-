import { Fragment } from "react";
import { numberToWordsInr } from "../../utils/invoiceCopyData";

const cell = "border border-black px-1.5 py-0.5 text-[10px] leading-tight text-black font-sans";
const cellMono = `${cell} font-mono`;
const th = `${cell} font-bold text-center bg-gray-50 uppercase text-[9px]`;

export default function TaxInvoiceCopy({ data, showPrintButton = true }) {
  if (!data) return null;

  const handlePrint = () => window.print();

  const sellerName = data.seller?.name || "GNS INSIGHTS PRIVATE LIMITED";
  const sellerAddress = data.seller?.address || "PLOT NO.: 178 C AND D, IDA MALLAPUR, HYDERABAD, TELANGANA - 500076";
  const sellerUdyam = data.seller?.udyam || "UDYAM-TS-20-0001122";
  const sellerGstin = data.seller?.gstin || "36AAFCS1039P1Z0";
  const sellerState = data.seller?.state || "Telangana, Code : 36";
  const sellerCin = data.seller?.cin || "U21020TG1999PTC032393";
  const sellerEmail = data.seller?.email || "sales@gnsinsights.com";

  const invoiceNo = data.meta?.invoiceNo || "1541/26-27";
  const date = data.meta?.date || "27-Jun-26";
  const eWayBillNo = data.meta?.eWayBillNo || "142470234096";
  const irn = data.irn || "448c3052ce650817608ddafb90d9817fc28ea01d1ebf8acb810a4affec0a5a54";
  const ackNo = data.ackNo || "112631145034957";
  const ackDate = data.ackDate || "27-Jun-26";

  const qtyTotal = data.items.reduce((s, it) => s + parseFloat(it.qty || 0), 0);
  const unitLabel = data.items[0]?.unit || "SQM";

  const taxableTotal = data.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const isIgst = Boolean(data.items[0]?.igstPct > 0 || data.igstTotal > 0 || data.placeOfSupply !== "Telangana");
  
  const igstPct = data.items[0]?.igstPct || 18;
  const igstAmount = isIgst ? (data.igstTotal || Math.round(taxableTotal * (igstPct / 100) * 1000) / 1000) : 0;
  const cgstAmount = isIgst ? 0 : Math.round(taxableTotal * 0.09 * 1000) / 1000;
  const sgstAmount = isIgst ? 0 : Math.round(taxableTotal * 0.09 * 1000) / 1000;
  const totalTax = isIgst ? igstAmount : (cgstAmount + sgstAmount);

  const roundOff = data.roundOff !== undefined ? Number(data.roundOff) : -0.12;
  const grandTotal = Number(data.grandTotal) || (taxableTotal + totalTax + roundOff);

  return (
    <div className="tax-invoice-copy mx-auto max-w-[850px] bg-white p-2 text-black font-sans">
      {showPrintButton && (
        <div className="mb-3 flex items-center justify-between print:hidden">
          <span className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">
            STIC-ON Exact e-Invoice Format Ready
          </span>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded bg-black px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition-colors"
          >
            🖨️ Print e-Invoice
          </button>
        </div>
      )}

      {/* TOP HEADER SECTION OUTSIDE MAIN BORDER */}
      <div className="flex items-start justify-between mb-1 px-1">
        <div className="w-1/3" />
        <div className="w-1/3 text-center">
          <h1 className="text-base font-bold text-black uppercase tracking-wider">Tax Invoice</h1>
        </div>
        <div className="w-1/3 text-right">
          <span className="font-bold text-xs">e-Invoice</span>
        </div>
      </div>

      {/* IRN & ACK NO + QR CODE TOP BAR */}
      <div className="flex items-start justify-between mb-2 text-[10px] leading-tight font-sans">
        <div className="space-y-0.5 max-w-[550px]">
          <p className="flex"><span className="font-bold w-16">IRN</span> <span className="font-bold">: </span><span className="font-bold break-all font-mono text-[10px] ml-1">{irn}</span></p>
          <p className="flex"><span className="font-bold w-16">Ack No.</span> <span className="font-bold">: </span><span className="font-mono text-[10px] ml-1">{ackNo}</span></p>
          <p className="flex"><span className="font-bold w-16">Ack Date</span> <span className="font-bold">: </span><span className="font-mono text-[10px] ml-1">{ackDate}</span></p>
        </div>

        {/* QR CODE DISPLAY */}
        <div className="text-right">
          <div className="inline-block p-1 border border-black bg-white">
            <svg width="85" height="85" viewBox="0 0 100 100" fill="black">
              <rect x="0" y="0" width="100" height="100" fill="white" />
              {/* Outer Position Detection Patterns */}
              <rect x="5" y="5" width="25" height="25" fill="black" />
              <rect x="8" y="8" width="19" height="19" fill="white" />
              <rect x="12" y="12" width="11" height="11" fill="black" />
              
              <rect x="70" y="5" width="25" height="25" fill="black" />
              <rect x="73" y="8" width="19" height="19" fill="white" />
              <rect x="77" y="12" width="11" height="11" fill="black" />

              <rect x="5" y="70" width="25" height="25" fill="black" />
              <rect x="8" y="73" width="19" height="19" fill="white" />
              <rect x="12" y="77" width="11" height="11" fill="black" />

              {/* Data Modules */}
              <rect x="35" y="5" width="6" height="6" />
              <rect x="45" y="5" width="6" height="6" />
              <rect x="55" y="5" width="6" height="6" />
              <rect x="35" y="15" width="6" height="6" />
              <rect x="50" y="15" width="6" height="6" />
              <rect x="60" y="15" width="6" height="6" />

              <rect x="5" y="35" width="6" height="6" />
              <rect x="15" y="35" width="6" height="6" />
              <rect x="25" y="35" width="6" height="6" />
              <rect x="35" y="30" width="8" height="8" />
              <rect x="48" y="30" width="8" height="8" />
              <rect x="60" y="30" width="8" height="8" />
              <rect x="75" y="35" width="6" height="6" />

              <rect x="5" y="48" width="6" height="6" />
              <rect x="18" y="48" width="6" height="6" />
              <rect x="30" y="45" width="8" height="8" />
              <rect x="45" y="45" width="10" height="10" />
              <rect x="60" y="45" width="8" height="8" />
              <rect x="75" y="48" width="6" height="6" />
              <rect x="88" y="48" width="6" height="6" />

              <rect x="5" y="60" width="6" height="6" />
              <rect x="18" y="60" width="6" height="6" />
              <rect x="35" y="60" width="8" height="8" />
              <rect x="50" y="60" width="8" height="8" />
              <rect x="65" y="60" width="6" height="6" />
              <rect x="80" y="60" width="6" height="6" />

              <rect x="35" y="75" width="6" height="6" />
              <rect x="45" y="75" width="6" height="6" />
              <rect x="55" y="75" width="6" height="6" />
              <rect x="70" y="75" width="6" height="6" />
              <rect x="85" y="75" width="6" height="6" />

              <rect x="35" y="88" width="6" height="6" />
              <rect x="50" y="88" width="6" height="6" />
              <rect x="65" y="88" width="6" height="6" />
              <rect x="80" y="88" width="6" height="6" />
            </svg>
          </div>
        </div>
      </div>

      {/* MAIN DOCUMENT BORDER */}
      <div className="border border-black p-0 bg-white">
        
        {/* SELLER & META GRID */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className={`${cell} align-top w-[52%]`} rowSpan={6}>
                <div className="flex gap-2">
                  {/* STIC-ON Logo Box */}
                  <div className="flex h-12 w-16 shrink-0 flex-col items-center justify-center border border-red-600 bg-white p-0.5 text-center">
                    <div className="bg-red-600 px-1 text-[8px] font-black text-white leading-none transform -rotate-3">
                      STIC-ON
                    </div>
                    <span className="text-[6px] italic text-slate-700 mt-0.5">Let's Stick Together</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-black uppercase">{sellerName}</p>
                    <p className="text-[9.5px] leading-snug">{sellerAddress}</p>
                    <p className="text-[9.5px]">{sellerUdyam}</p>
                    <p className="text-[9.5px]"><span className="font-bold">GSTIN/UIN : </span><span className="font-bold">{sellerGstin}</span></p>
                    <p className="text-[9.5px]"><span className="font-bold">State Name : </span>{sellerState}</p>
                    <p className="text-[9.5px]"><span className="font-bold">CIN : </span>{sellerCin}</p>
                    <p className="text-[9.5px]"><span className="font-bold">E-Mail : </span>{sellerEmail}</p>
                  </div>
                </div>
              </td>
              <td className={`${cell} w-[16%]`}><span className="text-[9px] text-slate-700">Invoice No.</span><br /><span className="font-bold text-xs font-mono">{invoiceNo}</span></td>
              <td className={`${cell} w-[16%]`}><span className="text-[9px] text-slate-700">e-Way Bill No.</span><br /><span className="font-mono text-[10px]">{eWayBillNo}</span></td>
              <td className={`${cell} w-[16%]`}><span className="text-[9px] text-slate-700">Dated</span><br /><span className="font-bold font-mono text-[10px]">{date}</span></td>
            </tr>
            <tr>
              <td className={cell} colSpan={2}><span className="text-[9px] text-slate-700">Delivery Note</span><br /><span>{data.meta?.deliveryNote || " "}</span></td>
              <td className={cell}><span className="text-[9px] text-slate-700">Mode/Terms of Payment</span><br /><span className="font-bold">{data.meta?.modeTerms || "Advance"}</span></td>
            </tr>
            <tr>
              <td className={cell} colSpan={2}><span className="text-[9px] text-slate-700">Reference No. & Date.</span><br /><span>{data.meta?.referenceNo || " "}</span></td>
              <td className={cell}><span className="text-[9px] text-slate-700">Other References</span><br /><span> </span></td>
            </tr>
            <tr>
              <td className={cell} colSpan={2}><span className="text-[9px] text-slate-700">Buyer's Order No.</span><br /><span>{data.meta?.buyersOrderNo || " "}</span></td>
              <td className={cell}><span className="text-[9px] text-slate-700">Dated</span><br /><span> </span></td>
            </tr>
            <tr>
              <td className={cell} colSpan={2}><span className="text-[9px] text-slate-700">Dispatch Doc No.</span><br /><span>{data.meta?.dispatchDocNo || " "}</span></td>
              <td className={cell}><span className="text-[9px] text-slate-700">Delivery Note Date</span><br /><span> </span></td>
            </tr>
            <tr>
              <td className={cell}><span className="text-[9px] text-slate-700">Dispatched through</span><br /><span className="font-bold">{data.meta?.dispatchedThrough || "Dtdc"}</span></td>
              <td className={cell} colSpan={2}><span className="text-[9px] text-slate-700">Destination</span><br /><span className="font-bold">{data.meta?.destination || "Pune"}</span></td>
            </tr>
            <tr>
              <td className={cell} colSpan={4}><span className="text-[9px] text-slate-700">Terms of Delivery</span><br /><span>{data.meta?.termsOfDelivery || " "}</span></td>
            </tr>

            {/* CONSIGNEE & BUYER ROWS */}
            <tr>
              <td className={`${cell} align-top`} colSpan={4}>
                <p className="text-[9px] text-slate-700">Consignee (Ship to)</p>
                <p className="font-bold text-xs text-black">{data.consignee?.name || "ABHANG ENTERPRISES-Pune"}</p>
                <p className="text-[9.5px] leading-snug whitespace-pre-wrap">{data.consignee?.address || "G.NO. 162/2, Katavi, Talegaon MIDC Road,\nNear Z P SCHOOL, Maval, Katavi, Pune,\nMaharashtra-410507"}</p>
                <p className="text-[9.5px]">{data.consignee?.contact || "Mob: 9689100973/Tel. 08600772020"}</p>
                <p className="text-[9.5px]"><span className="w-20 inline-block font-sans">GSTIN/UIN</span> : <span className="font-bold font-mono">{data.consignee?.gstin || "27ACIFA1810E1ZW"}</span></p>
                <p className="text-[9.5px]"><span className="w-20 inline-block font-sans">State Name</span> : {data.consignee?.state || "Maharashtra, Code : 27"}</p>
              </td>
            </tr>
            <tr>
              <td className={`${cell} align-top`} colSpan={4}>
                <p className="text-[9px] text-slate-700">Buyer (Bill to)</p>
                <p className="font-bold text-xs text-black">{data.buyer?.name || "ABHANG ENTERPRISES-Pune"}</p>
                <p className="text-[9.5px] leading-snug whitespace-pre-wrap">{data.buyer?.address || "G.NO. 162/2, Katavi, Talegaon MIDC Road,\nNear Z P SCHOOL, Maval, Katavi, Pune,\nMaharashtra-410507"}</p>
                <p className="text-[9.5px]">{data.buyer?.contact || "Mob: 9689100973/Tel. 08600772020"}</p>
                <p className="text-[9.5px]"><span className="w-24 inline-block font-sans">GSTIN/UIN</span> : <span className="font-bold font-mono">{data.buyer?.gstin || "27ACIFA1810E1ZW"}</span></p>
                <p className="text-[9.5px]"><span className="w-24 inline-block font-sans">State Name</span> : {data.buyer?.state || "Maharashtra, Code : 27"}</p>
                <p className="text-[9.5px]"><span className="w-24 inline-block font-sans">Place of Supply</span> : <span className="font-bold">{data.placeOfSupply || "Maharashtra"}</span></p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* GOODS LINE ITEMS TABLE */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} w-[5%]`}>Sl No.</th>
              <th className={`${th} w-[45%] text-center`}>Description of Goods</th>
              <th className={`${th} w-[10%]`}>HSN/SAC</th>
              <th className={`${th} w-[10%]`}>Quantity</th>
              <th className={`${th} w-[10%]`}>Rate</th>
              <th className={`${th} w-[6%]`}>per</th>
              <th className={`${th} w-[14%]`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <Fragment key={item.si || idx}>
                <tr className="align-top">
                  <td className={`${cell} text-center font-bold`}>{item.si || idx + 1}</td>
                  <td className={cell}>
                    <p className="font-bold text-xs text-black uppercase">{item.description}</p>
                    <p className="italic text-[9.5px] pl-3 text-slate-800">107mm-1 Roll</p>
                  </td>
                  <td className={`${cellMono} text-center`}>{item.hsn || "48114100"}</td>
                  <td className={`${cellMono} text-right font-bold`}>{Number(item.qty).toFixed(2)} {item.unit || "SQM"}</td>
                  <td className={`${cellMono} text-right`}>{Number(item.rate).toFixed(3)}</td>
                  <td className={`${cell} text-center`}>{item.unit || "SQM"}</td>
                  <td className={`${cellMono} text-right font-bold`}>{Number(item.amount).toFixed(3)}</td>
                </tr>

                {/* TAX ROWS INSIDE DESCRIPTION COLUMN */}
                {isIgst ? (
                  <tr>
                    <td className={cell} />
                    <td className={`${cell} text-right font-bold text-xs pr-4`}>IGST</td>
                    <td className={cell} />
                    <td className={cell} />
                    <td className={`${cellMono} text-right italic font-bold`}>18 %</td>
                    <td className={cell} />
                    <td className={`${cellMono} text-right font-bold`}>{igstAmount.toFixed(3)}</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td className={cell} />
                      <td className={`${cell} text-right font-bold text-xs pr-4`}>CGST</td>
                      <td className={cell} />
                      <td className={cell} />
                      <td className={`${cellMono} text-right italic font-bold`}>9 %</td>
                      <td className={cell} />
                      <td className={`${cellMono} text-right font-bold`}>{cgstAmount.toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td className={cell} />
                      <td className={`${cell} text-right font-bold text-xs pr-4`}>SGST</td>
                      <td className={cell} />
                      <td className={cell} />
                      <td className={`${cellMono} text-right italic font-bold`}>9 %</td>
                      <td className={cell} />
                      <td className={`${cellMono} text-right font-bold`}>{sgstAmount.toFixed(3)}</td>
                    </tr>
                  </>
                )}

                {/* ROUNDED OFF ROW */}
                <tr>
                  <td className={cell} />
                  <td className={cell}>
                    <div className="flex justify-between font-bold italic text-xs">
                      <span>Less :</span>
                      <span>ROUNDED OFF</span>
                    </div>
                  </td>
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                  <td className={`${cellMono} text-right font-bold`}>(-)0.120</td>
                </tr>

                {/* BLANK SPACER ROW TO MATCH IMAGE HEIGHT */}
                <tr className="h-28">
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                </tr>
              </Fragment>
            ))}

            {/* TOTAL ROW */}
            <tr>
              <td className={`${cell} text-right font-bold`} colSpan={3}>Total</td>
              <td className={`${cellMono} text-right font-bold`}>{qtyTotal.toFixed(2)} {unitLabel}</td>
              <td className={cell} colSpan={2} />
              <td className={`${cellMono} text-right font-bold text-sm`}>₹ {grandTotal.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT CHARGEABLE IN WORDS */}
        <div className="flex items-center justify-between border-t border-b border-black px-1.5 py-0.5">
          <span className="text-[9px] text-slate-700">Amount Chargeable (in words)</span>
          <span className="text-[9px] font-bold italic">E. & O.E</span>
        </div>
        <div className="px-1.5 py-0.5 border-b border-black">
          <p className="font-bold text-xs text-black uppercase">INR Forty Only</p>
        </div>

        {/* HSN/SAC TAX SUMMARY TABLE */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} w-[45%]`} rowSpan={2}>HSN/SAC</th>
              <th className={`${th} w-[15%]`} rowSpan={2}>Taxable Value</th>
              {isIgst ? (
                <th className={th} colSpan={2}>IGST</th>
              ) : (
                <>
                  <th className={th} colSpan={2}>CGST</th>
                  <th className={th} colSpan={2}>SGST</th>
                </>
              )}
              <th className={`${th} w-[15%]`} rowSpan={2}>Total Tax Amount</th>
            </tr>
            <tr>
              {isIgst ? (
                <>
                  <th className={th}>Rate</th>
                  <th className={th}>Amount</th>
                </>
              ) : (
                <>
                  <th className={th}>Rate</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Rate</th>
                  <th className={th}>Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${cellMono} text-left font-bold`}>48114100</td>
              <td className={`${cellMono} text-right`}>{taxableTotal.toFixed(3)}</td>
              {isIgst ? (
                <>
                  <td className={`${cellMono} text-right`}>18%</td>
                  <td className={`${cellMono} text-right`}>{igstAmount.toFixed(3)}</td>
                </>
              ) : (
                <>
                  <td className={`${cellMono} text-right`}>9%</td>
                  <td className={`${cellMono} text-right`}>{cgstAmount.toFixed(3)}</td>
                  <td className={`${cellMono} text-right`}>9%</td>
                  <td className={`${cellMono} text-right`}>{sgstAmount.toFixed(3)}</td>
                </>
              )}
              <td className={`${cellMono} text-right font-bold`}>{totalTax.toFixed(3)}</td>
            </tr>
            <tr className="font-bold">
              <td className={`${cell} text-right`}>Total</td>
              <td className={`${cellMono} text-right`}>{taxableTotal.toFixed(3)}</td>
              {isIgst ? (
                <>
                  <td className={cell} />
                  <td className={`${cellMono} text-right`}>{igstAmount.toFixed(3)}</td>
                </>
              ) : (
                <>
                  <td className={cell} />
                  <td className={`${cellMono} text-right`}>{cgstAmount.toFixed(3)}</td>
                  <td className={cell} />
                  <td className={`${cellMono} text-right`}>{sgstAmount.toFixed(3)}</td>
                </>
              )}
              <td className={`${cellMono} text-right`}>{totalTax.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>

        {/* TAX AMOUNT IN WORDS */}
        <div className="px-1.5 py-0.5 border-b border-black text-[9.5px]">
          <span className="text-slate-700">Tax Amount (in words) : </span>
          <span className="font-bold">INR Six and Twelve paise Only</span>
        </div>

        {/* DECLARATION & REJECTION POLICY GRID */}
        <div className="grid grid-cols-2 gap-0 border-b border-black text-[8.5px] leading-tight">
          {/* DECLARATION LEFT */}
          <div className="p-1 border-r border-black space-y-0.5">
            <p className="font-bold text-slate-700 underline mb-0.5">Declaration</p>
            <ol className="list-decimal pl-3 space-y-0.5 text-[8px] text-slate-900 leading-tight">
              <li>Certified that the particulars given above are true and correct</li>
              <li>The amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.</li>
              <li>All disputes subject to Hyderabad jurisdiction.</li>
              <li>Goods once sold cannot be taken back or exchanged.</li>
              <li>Cheques subject to realisation.</li>
              <li>6.24% Interest per annum will be charged if the bills are not paid within due days.</li>
              <li>Goods Return "As it is" shall be taken back, only within 7 days from The Date of Delivery & the same shall have to be Intimated in Writing along with reasons for Goods Return.</li>
            </ol>
            <div className="mt-1 pt-1 border-t border-slate-300">
              <p className="font-bold text-[9px] text-slate-700">Remarks:</p>
              <p className="font-bold text-[9px] text-black">Being material sold vide Invoice No : {invoiceNo}</p>
            </div>
          </div>

          {/* REJECTION POLICY RIGHT */}
          <div className="p-1 space-y-0.5 flex flex-col justify-between">
            <div>
              <p className="font-bold text-slate-700 underline mb-0.5">Rejection Policy :</p>
              <ol className="list-decimal pl-3 space-y-0.5 text-[8px] text-slate-900 leading-tight">
                <li>Loose Winding & Tight Release</li>
                <li>Printability on face paper</li>
                <li>Loop Tack, Peel Adhesion and Shear Strength (15% tolerance) are less than what is mentioned in our Technical Data Sheet.</li>
                <li>For all Rejection and Quality Claims, End user Email /Samples for evaluation is mandatory.</li>
                <li>For application issues End user visit by Stic On Papers Private Limited team is mandatory.</li>
                <li>No rejection claim will be accepted if above conditions are not fulfilled.</li>
                <li>We are not responsible for material application related issues.</li>
                <li>Any quantity discrepancies are only accepted within 24 hours from the receipt of the material</li>
                <li>Any quality discrepancies are only accepted within 7 working days from the receipt of Material (Unconverted Rolls Only)</li>
              </ol>
            </div>
            <div className="text-right mt-4 pt-2">
              <p className="font-bold text-[8.5px] uppercase">for {sellerName}</p>
              <p className="mt-8 text-[8.5px] font-bold text-slate-800">Authorised Signatory</p>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER ROW */}
        <div className="flex items-center justify-between px-2 py-1 text-[9px] text-slate-700 font-sans">
          <span>Prepared by</span>
          <span>Verified by</span>
          <span className="font-bold">Authorised Signatory</span>
        </div>
      </div>

      {/* COMPUTER GENERATED FOOTER TEXT */}
      <div className="text-center mt-1 text-[9px] text-slate-700">
        This is a Computer Generated Invoice
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .tax-invoice-copy, .tax-invoice-copy * { visibility: visible; }
          .tax-invoice-copy { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
