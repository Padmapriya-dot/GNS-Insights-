import { useMemo } from "react";
import ResourcePage from "../../components/common/ResourcePage";
import { createBizDocument, listBizDocuments } from "../../api/bizDocumentsApi";

const COLUMNS = [
  { key: "document_number", label: "Doc No." },
  { key: "party_name", label: "Party" },
  { key: "document_date", label: "Date" },
  {
    key: "amount",
    label: "Amount",
    render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`,
  },
  { key: "status", label: "Status" },
];

const FIELDS = [
  { name: "party_name", label: "Party Name", required: true },
  { name: "document_date", label: "Date", type: "date", required: true },
  { name: "amount", label: "Amount", type: "number", default: 0 },
  { name: "notes", label: "Notes", type: "textarea" },
];

/**
 * Shared list/create UI for Sales & Purchases document types.
 */
export default function BizDocumentPage({
  title,
  subtitle,
  module = "sales",
  docType,
  createLabel = "+ Create",
}) {
  const fetcher = useMemo(
    () => () => listBizDocuments({ module, doc_type: docType, page_size: 100 }),
    [module, docType]
  );

  const createFn = useMemo(
    () => (payload) =>
      createBizDocument({
        ...payload,
        module,
        doc_type: docType,
        document_date: payload.document_date || new Date().toISOString().slice(0, 10),
        amount: Number(payload.amount) || 0,
        status: "issued",
      }),
    [module, docType]
  );

  return (
    <ResourcePage
      title={title}
      subtitle={subtitle}
      columns={COLUMNS}
      fields={FIELDS}
      fetcher={fetcher}
      createFn={createFn}
      createLabel={createLabel}
      searchKeys={["document_number", "party_name", "status"]}
      emptyTitle={`No ${title.toLowerCase()} yet`}
      emptyDescription="Create your first record to get started."
    />
  );
}
