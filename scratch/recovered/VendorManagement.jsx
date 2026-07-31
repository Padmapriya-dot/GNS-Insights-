import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getVendors } from "../../api/procurementApi";
import { enrichApiVendor } from "../../data/vendorsMasterData";
import { exportToExcel } from "../../utils/exportUtils";
import useSettings from "../../context/SettingsContext";

const PAGE_BG = "#F5F5F5";
const PAGE_SIZES = [20, 50, 100];

export default function VendorManagement() {
  const { addToast } = useToast();
  const { companyName } = useSettings();
  const company = companyName?.trim() || "My Company";

  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVendors();
      const rows = Array.isArray(res.data) ? res.data : [];
      setVendors(rows.map((row, i) => enrichApiVendor(row, i)));
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) =>
      [
        v.name,
        v.email,
        v.gstin,
        v.phone,
        v.address_line1,
        v.city,
        v.state,
        v.pincode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [vendors, query]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const from = total === 0 ? 1 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const exportColumns = [
    { key: "name", label: "Vendor Name" },
    { key: "email", label: "Email" },
    { key: "gstin", label: "GSTIN" },
    { key: "phone", label: "Mobile No." },
    { key: "address_line1", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode" },
  ];

  const onExport = () => {
    exportToExcel(rows, exportColumns, "vendors");
    addToast("Exported to Excel", "success");
  };

  if (loading) return <Loader label="Loading vendors..." />;

  return (
    <div className="min-h-full" style={{ background: PAGE_BG }}>
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#1a1a1f]">Vendors</h1>
            <span className="rounded bg-[#d4d4d8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              v2
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[#d0d0d8] bg-white px-4 py-2 text-[14px] font-semibold text-[#1a1a1f]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F5C518]">
              <Building2 className="h-4 w-4" />
            </span>
            {company}
            <ChevronDown className="h-4 w-4 text-[#9a9aa5]" />
          </button>
        </div>

        <div className="rounded-xl border border-[#d0d0d8] bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa5]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-full border border-[#e4e4ea] bg-[#f3f3f6] py-2 pl-9 pr-3 text-[13px] outline-none"
              />
            </div>
            <Link
              to="/procurement/vendors/create"
              className="inline-flex items-center gap-1 rounded-lg border border-[#d0d0d8] bg-[#f3f3f6] px-3 py-2 text-[13px] font-semibold text-[#1a1a1f]"
            >
              <Upload className="h-4 w-4" />
              Bulk Import
            </Link>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1 rounded-lg border border-[#d0d0d8] bg-[#f3f3f6] px-3 py-2 text-[13px] font-semibold text-[#1a1a1f]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export (xlsx)
            </button>
            <Link
              to="/procurement/vendors/create"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#1a1a1f]"
              style={{ background: "#F5C518" }}
            >
              <Plus className="h-4 w-4" />
              Create Vendor
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#ececf0]">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#ececf0] bg-[#f5f5f5] text-[#6b6b76]">
                  <th className="px-3 py-2.5 font-medium">Vendor Name</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">GSTIN</th>
                  <th className="px-3 py-2.5 font-medium">Mobile No.</th>
                  <th className="px-3 py-2.5 font-medium">Address</th>
                  <th className="px-3 py-2.5 font-medium">City</th>
                  <th className="px-3 py-2.5 font-medium">State</th>
                  <th className="px-3 py-2.5 font-medium">Pincode</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id} className="border-b border-[#f0f0f4] text-[#1a1a1f]">
                    <td className="px-3 py-3">{v.name || "-"}</td>
                    <td className="px-3 py-3">{v.email || "-"}</td>
                    <td className="px-3 py-3">{v.gstin || "-"}</td>
                    <td className="px-3 py-3">{v.phone || "-"}</td>
                    <td className="px-3 py-3">{v.address_line1 || "-"}</td>
                    <td className="px-3 py-3">{v.city || "-"}</td>
                    <td className="px-3 py-3">{v.state || "-"}</td>
                    <td className="px-3 py-3">{v.pincode || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/procurement/vendors/${v.id}/edit`}
                          className="grid h-7 w-7 place-items-center rounded bg-[#f5f5f8] text-[#6b4eff]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          className="grid h-7 w-7 place-items-center rounded bg-[#f5f5f8] text-[#ef4444]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <div className="px-3 py-28 text-center text-[13px] text-[#8a8a96]">No data available</div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#6b6b76]">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-[#e2e2e8] bg-white px-2 py-1"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>
                {from}-{to} of {total}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="grid h-8 w-8 place-items-center rounded border border-[#e2e2e8] bg-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="grid h-8 min-w-8 place-items-center rounded border border-[#e2e2e8] bg-[#fff2b8] px-2"
              >
                {page}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="grid h-8 w-8 place-items-center rounded border border-[#e2e2e8] bg-white disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={loadVendors}
        className="fixed bottom-20 right-6 z-30 grid h-11 w-11 place-items-center rounded-xl border border-[#d0d0d8] bg-white shadow-lg hover:bg-[#f7f7f9] md:bottom-6"
        aria-label="Refresh vendors"
        title="Refresh"
      >
        <RefreshCw className="h-5 w-5 text-[#2563eb]" />
      </button>
    </div>
  );
}
