import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ClipboardList, Plus, Search } from "lucide-react";

import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { deletePurchaseOrder, getPurchaseOrdersEnriched } from "../../api/procurementApi";
import { apiErrorMessage } from "../../utils/apiError";
import { formatInr } from "../../data/procurementMasterData";

const YELLOW = "#F5C518";
const PAGE_BG = "#F5F5F5";
const PAGE_SIZES = [10, 20, 50];

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return String(iso).slice(0, 10);
  return `${d}/${m}/${y}`;
}

export default function PurchaseOrders() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPurchaseOrdersEnriched();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch {
      addToast("Failed to load purchase orders", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!window.confirm(`Cancel purchase order ${row.po_number}?`)) return;
    try {
      await deletePurchaseOrder(row.id);
      addToast("Purchase order cancelled", "success");
      await load();
    } catch (err) {
      addToast(apiErrorMessage(err, "Failed to cancel purchase order"), "error");
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.po_number || ""} ${r.vendor_name || r.supplier_name || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" style={{ background: PAGE_BG }}>
        <Loader label="Loading purchase orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <h1 className="text-[22px] font-bold text-[#1a1a1f]">Purchase Order</h1>

      <div className="mx-4 mb-6 rounded-2xl border border-[#e4e4ea] bg-white p-4 sm:mx-6 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa5]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-[#e4e4ea] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#1a1a1f] placeholder:text-[#9a9aa5] focus:border-[#F5C518] focus:outline-none focus:ring-2 focus:ring-[#F5C518]/25"
            />
          </div>
          <Link
            to="/procurement/purchase-orders/create"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1a1a1f] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-black"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Create
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e4e4ea]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-[13px]">
              <thead className="bg-[#efeaf8] text-[12px] font-semibold uppercase tracking-wide text-[#6b6b76]">
                <tr>
                  {[
                    "Purchase Order No.",
                    "Purchase Order Date",
                    "Vendor Name",
                    "Amount (₹)",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="border-b border-r border-[#d0d0d8] px-4 py-3 last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <ClipboardList className="mx-auto h-12 w-12 text-[#c4c4cc]" strokeWidth={1.25} />
                      <p className="mt-3 text-[14px] text-[#9a9aa5]">No data available.</p>
                      <Link
                        to="/procurement/purchase-orders/create"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1a1a1f] px-4 py-2.5 text-[14px] font-semibold text-white"
                      >
                        <Plus className="h-4 w-4" /> Create
                      </Link>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fafafa]">
                      <td className="border-t border-r border-[#d0d0d8] px-4 py-3 font-semibold text-[#6b4eff]">
                        {r.po_number}
                      </td>
                      <td className="border-t border-r border-[#d0d0d8] px-4 py-3 text-[#4a4a55]">
                        {fmtDate(r.order_date)}
                      </td>
                      <td className="border-t border-r border-[#d0d0d8] px-4 py-3">
                        {r.vendor_name || r.supplier_name || "—"}
                      </td>
                      <td className="border-t border-r border-[#d0d0d8] px-4 py-3 tabular-nums font-medium">
                        {formatInr(r.total_amount || r.amount || 0)}
                      </td>
                      <td className="border-t border-[#d0d0d8] px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/procurement/purchase-orders/${r.id}/edit`}
                            state={{ viewId: r.id, document: r }}
                            className="text-[12px] font-semibold text-[#6b4eff] hover:underline"
                          >
                            View
                          </Link>
                          <Link
                            to={`/procurement/purchase-orders/${r.id}/edit`}
                            state={{ viewId: r.id, document: r }}
                            className="text-[12px] font-semibold text-[#4a4a55] hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            className="text-[12px] font-semibold text-[#dc2626] hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#e4e4ea] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#6b6b76]">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-md border border-[#e4e4ea] bg-white px-2 py-1"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-[#e4e4ea] p-1.5 disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span
              className="min-w-[2rem] rounded-md border border-[#e4e4ea] px-2.5 py-1 text-center text-[13px] font-semibold"
              style={{ background: `${YELLOW}B3` }}
            >
              {page}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-[#e4e4ea] p-1.5 disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
