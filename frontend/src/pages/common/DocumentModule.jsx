import { useLocation } from "react-router-dom";
import BizDocumentPage from "../common/BizDocumentPage";

const CONFIG = {
  "/sales/payment-receipts": {
    title: "Payment Receipts",
    module: "sales",
    docType: "payment_receipt",
  },
  "/sales/refund-vouchers": {
    title: "Refund Vouchers",
    module: "sales",
    docType: "refund_voucher",
  },
  "/sales/proforma-invoices": {
    title: "Proforma Invoice",
    module: "sales",
    docType: "proforma",
  },
  "/sales/export-invoices": {
    title: "Export Invoice",
    module: "sales",
    docType: "export_invoice",
  },
  "/sales/export-proforma-invoices": {
    title: "Export Proforma Invoice",
    module: "sales",
    docType: "export_proforma",
  },
  "/sales/delivery-challans": {
    title: "Delivery Challans",
    module: "sales",
    docType: "delivery_challan",
  },
  "/sales/credit-notes": {
    title: "Credit Note",
    module: "sales",
    docType: "credit_note",
  },
  "/sales/debit-notes": {
    title: "Sales Debit Note",
    module: "sales",
    docType: "debit_note",
  },
  "/sales/e-invoice": {
    title: "e-Invoice",
    module: "sales",
    docType: "e_invoice",
  },
  "/purchases": {
    title: "Purchase",
    module: "purchases",
    docType: "purchase",
  },
  "/purchases/payments-made": {
    title: "Payments Made",
    module: "purchases",
    docType: "payment_made",
  },
  "/purchases/debit-notes": {
    title: "Debit Note",
    module: "purchases",
    docType: "purchase_debit_note",
  },
};

export default function DocumentModule() {
  const { pathname } = useLocation();
  const cfg = CONFIG[pathname] || {
    title: "Documents",
    module: "sales",
    docType: "misc",
  };
  return <BizDocumentPage {...cfg} createLabel={`+ Create ${cfg.title}`} />;
}
