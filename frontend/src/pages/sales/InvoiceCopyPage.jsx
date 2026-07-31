import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Loader from "../../components/common/Loader";
import Invoice from "../../components/sales/Invoice";
import { getInvoiceDetail } from "../../api/salesApi";
import { useCompanySettings } from "../../hooks/useCompanySettings";
import { SAMPLE_INVOICE_COPY, mapDetailToInvoiceCopy, mergeWithSampleIfEmpty } from "../../utils/invoiceCopyData";

export default function InvoiceCopyPage() {
  const { id } = useParams();
  const { settings } = useCompanySettings();
  const [loading, setLoading] = useState(Boolean(id));
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!id) return;

    // Check localStorage first (covers locally-created invoices)
    const allLocal = [
      ...JSON.parse(localStorage.getItem("smrt_invoices") || "[]"),
      ...JSON.parse(localStorage.getItem("smrt_sales_bills") || "[]"),
    ];
    const localMatch = allLocal.find(
      (inv) => String(inv.id) === String(id) || String(inv.invoice_number) === String(id)
    );
    if (localMatch) {
      setDetail({
        invoice: localMatch,
        items: localMatch.items || [],
        customer: { name: localMatch.customer_name || "Customer" },
      });
      setLoading(false);
      return;
    }

    getInvoiceDetail(id)
      .then((r) => setDetail(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const copyData = useMemo(() => {
    if (!id) return SAMPLE_INVOICE_COPY;
    const mapped = mapDetailToInvoiceCopy(detail, settings || {});
    return mapDetailToInvoiceCopy(detail, settings || {});
  }, [id, detail, settings]);

  if (loading) return <Loader label="Loading invoice..." />;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/sales/invoices" className="text-sm font-semibold text-[#2563EB] hover:underline">
          ← Back to Invoices
        </Link>
        {!id && (
          <span className="text-sm text-slate-500">Sample GST Tax Invoice copy</span>
        )}
      </div>
      <Invoice data={copyData} />
    </div>
  );
}
