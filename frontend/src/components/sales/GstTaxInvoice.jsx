import ErpDocumentTemplate from "../documents/ErpDocumentTemplate";

/** GST Tax Invoice — uses unified ERP document template. */
export default function GstTaxInvoice({ data }) {
  return <ErpDocumentTemplate data={data} docType="invoice" />;
}
