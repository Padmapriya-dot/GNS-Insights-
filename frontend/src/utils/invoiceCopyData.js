/** Indian Rupee amount to words (simplified). */
const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ones[n];
  return `${tens[Math.floor(n / 10)]}${ones[n % 10] ? ` ${ones[n % 10]}` : ""}`.trim();
}

function threeDigits(n) {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);
  return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${twoDigits(n % 100)}` : ""}`.trim();
}

export function numberToWordsInr(amount) {
  const n = Math.round(Number(amount) * 100) / 100;
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);

  if (rupees === 0 && paise === 0) return "INR Zero Only";

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  const parts = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));

  let words = `INR ${parts.join(" ")}`.trim();
  if (paise) words += ` and ${twoDigits(paise)} paise`;
  return `${words} Only`;
}

const joinAddress = (...parts) =>
  parts
    .flatMap((part) => (typeof part === "string" ? [part] : []))
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

const normalizeCustomer = (detail) => {
  if (!detail) return {};
  return detail.customer || detail.buyer || detail.consignee || {};
};

export function mapDetailToInvoiceCopy(detail, companySettings = {}) {
  if (!detail?.invoice) return null;

  const inv = detail.invoice;
  const cust = normalizeCustomer(detail);
  const taxValue = (obj, camelKey, snakeKey) => Number(obj?.[camelKey] ?? obj?.[snakeKey]) || 0;

  const invoiceIgstPct = taxValue(inv, "igstPct", "igst_pct");
  const invoiceCgstPct = taxValue(inv, "cgstPct", "cgst_pct");
  const invoiceSgstPct = taxValue(inv, "sgstPct", "sgst_pct");

  const invoiceIgstAmt = Number(inv.igstAmount) || Number(inv.igst_amount) || 0;
  const invoiceCgstAmt = Number(inv.cgstAmount) || Number(inv.cgst_amount) || 0;
  const invoiceSgstAmt = Number(inv.sgstAmount) || Number(inv.sgst_amount) || 0;

  const itemHasCgstSgst = (detail.items || []).some((item) =>
    taxValue(item, "cgstPct", "cgst_pct") > 0 ||
    taxValue(item, "sgstPct", "sgst_pct") > 0 ||
    Number(item.cgstAmount) > 0 ||
    Number(item.cgst_amount) > 0 ||
    Number(item.sgstAmount) > 0 ||
    Number(item.sgst_amount) > 0
  );

  const hasCgstSgst = Boolean(
    invoiceCgstPct ||
    invoiceSgstPct ||
    invoiceCgstAmt ||
    invoiceSgstAmt ||
    itemHasCgstSgst
  );

  const items = (detail.items || []).map((item, i) => {
    const taxable = Number(item.amount) || 0;
    const igstPct = taxValue(item, "igstPct", "igst_pct") || invoiceIgstPct;
    const cgstPct = taxValue(item, "cgstPct", "cgst_pct") || invoiceCgstPct;
    const sgstPct = taxValue(item, "sgstPct", "sgst_pct") || invoiceSgstPct;
    const igstAmount = Number(item.igstAmount) || Number(item.igst_amount) || (igstPct ? Math.round(taxable * igstPct) / 100 : 0);
    const cgstAmount = Number(item.cgstAmount) || Number(item.cgst_amount) || (cgstPct ? Math.round(taxable * cgstPct) / 100 : 0);
    const sgstAmount = Number(item.sgstAmount) || Number(item.sgst_amount) || (sgstPct ? Math.round(taxable * sgstPct) / 100 : 0);
    return {
      si: i + 1,
      description: item.item_description || item.description || item.product_name || item.name || item.item_name || "",
      hsn: item.hsn || item.hsn_code || item.hsn_sac || "48114100",
      qty: Number(item.qty || item.quantity || 0).toFixed(2),
      unit: (item.unit || item.uom || "pcs").toUpperCase(),
      rate: Number(item.rate || item.unit_price || item.price || 0).toFixed(3),
      amount: taxable,
      igstPct,
      igstAmount,
      cgstPct: hasCgstSgst ? cgstPct : 0,
      cgstAmount: hasCgstSgst ? cgstAmount : 0,
      sgstPct: hasCgstSgst ? sgstPct : 0,
      sgstAmount: hasCgstSgst ? sgstAmount : 0,
    };
  });

  const taxableTotal = items.reduce((s, it) => s + it.amount, 0);
  const igstTotal = Number(inv.igst_amount) || items.reduce((s, it) => s + it.igstAmount, 0);
  const cgstTotal = Number(inv.cgst_amount) || items.reduce((s, it) => s + it.cgstAmount, 0);
  const sgstTotal = Number(inv.sgst_amount) || items.reduce((s, it) => s + it.sgstAmount, 0);
  const roundOff = Number(inv.round_off) || 0;
  const grandTotal = Number(inv.grand_total) || taxableTotal + igstTotal + cgstTotal + sgstTotal + roundOff;

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, "-");
  };

  const sellerName = companySettings.company_name || companySettings.name || "GNS Insights";
  const sellerGstin = companySettings.gstin || companySettings.gst_number || "36XXXXX0000X1Z0";

  return {
    title: "Tax Invoice",
    eInvoice: Boolean(companySettings.e_invoice_enabled),
    irn: companySettings.irn || "—",
    ackNo: companySettings.ack_no || "—",
    ackDate: formatDate(inv.issue_date),
    seller: {
      name: sellerName,
      tagline: companySettings.tagline || "Business Intelligence • Analytics • AI",
      address: [companySettings.address_line1, companySettings.address_line2, companySettings.city, companySettings.state, companySettings.pincode].filter(Boolean).join(", ") || "Hyderabad, Telangana",
      udyam: companySettings.udyam || "",
      gstin: sellerGstin,
      state: `${companySettings.state || "Telangana"}, Code: ${companySettings.state_code || "36"}`,
      cin: companySettings.cin || "",
      email: companySettings.email || companySettings.contact_email || "",
    },
    meta: {
      invoiceId: inv.id,
      invoiceNo: inv.invoice_number,
      date: formatDate(inv.issue_date),
      deliveryNote: "",
      modeTerms: "Advance",
      referenceNo: "",
      buyersOrderNo: "",
      dispatchDocNo: "",
      dispatchedThrough: "",
      destination: cust.state || "",
      eWayBillNo: "",
      termsOfDelivery: "",
    },
    consignee: {
      name: cust.name || cust.company || cust.customer_name || "",
      address: joinAddress(
        cust.address,
        cust.address_line1,
        cust.address_line2,
        cust.billing_address,
        cust.shipping_address,
        cust.city,
        cust.pincode,
        cust.state
      ),
      contact: cust.phone || cust.contact || cust.mobile || "",
      gstin: cust.gstin || cust.GSTIN || "",
      state: cust.state ? `${cust.state}, Code: ${cust.state_code || ""}` : "",
    },
    buyer: {
      name: cust.name || cust.company || cust.customer_name || "",
      address: joinAddress(
        cust.address,
        cust.address_line1,
        cust.address_line2,
        cust.billing_address,
        cust.shipping_address,
        cust.city,
        cust.pincode,
        cust.state
      ),
      contact: cust.phone || cust.contact || cust.mobile || "",
      gstin: cust.gstin || cust.GSTIN || "",
      state: cust.state ? `${cust.state}, Code: ${cust.state_code || ""}` : "",
    },
    placeOfSupply: cust.state || "",
    items,
    roundOff: Number(inv.round_off) || 0,
    grandTotal,
    taxableTotal,
    igstTotal,
    remarks: `Being material sold vide Invoice No : ${inv.invoice_number}`,
  };
}

