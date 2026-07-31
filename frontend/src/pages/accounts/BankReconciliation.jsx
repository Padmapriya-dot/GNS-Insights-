import { useEffect, useState, useCallback, useRef } from "react";
<<<<<<< HEAD
import { RefreshCw, CheckCircle, HelpCircle, Upload, Check } from "lucide-react";
import FinanceFilters from "../../components/finance/FinanceFilters";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getExtendedReports, getTenantPref, putTenantPref } from "../../api/accountsApi";
import { formatInr } from "../../data/financeMasterData";
import { apiErrorMessage } from "../../utils/apiError";

const PREF_KEY = "bank_reconciliation_v1";

function parseStatementCsv(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;
    const amountRaw = parts[parts.length - 1];
    const amount = Number(String(amountRaw).replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(amount)) continue;
    rows.push({
      id: `upload-${i}-${Date.now()}`,
      date: parts[0] || "",
      description: parts.slice(1, -1).join(" ") || parts[1] || "Statement line",
      amount,
      matched: false,
    });
  }
  return rows;
=======
import { RefreshCw, CheckCircle, HelpCircle, FileSpreadsheet, Upload, Check, X, FileText, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import FinanceFilters from "../../components/finance/FinanceFilters";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { formatInr } from "../../data/financeMasterData";
import { getInvoices, getPayments } from "../../api/salesApi";

export default function BankReconciliation() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);         // initial page load
  const [refreshing, setRefreshing] = useState(false);  // button-only spinner
  const fileInputRef = useRef(null);
  const [uploadPreview, setUploadPreview] = useState(null); // { rows, fileName }
  const [financialYear, setFinancialYear] = useState("2026-27");
  const [month, setMonth] = useState("All Months");
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const [ledgerLines, setLedgerLines] = useState([]);
  const [bankLines, setBankLines] = useState([]);

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch real invoices and payments from backend
      const [invRes, payRes] = await Promise.allSettled([
        getInvoices(),
        getPayments(),
      ]);

      const invoices = invRes.status === "fulfilled"
        ? (Array.isArray(invRes.value?.data) ? invRes.value.data : [])
        : [];
      const payments = payRes.status === "fulfilled"
        ? (Array.isArray(payRes.value?.data) ? payRes.value.data : [])
        : [];

      // ── Build Ledger Lines from invoices (money owed to company) ──
      const ledger = invoices.map((inv, i) => ({
        id: `inv-${inv.id || i}`,
        date: String(inv.issue_date || inv.created_at || "").slice(0, 10),
        desc: `Invoice ${inv.invoice_number || `#${inv.id}`} — ${inv.customer_name || "Customer"}`,
        ref: inv.invoice_number || "",
        amount: Number(inv.grand_total || 0),
        reconciled: inv.status === "paid",
        type: "invoice",
      }));

      // ── Build Bank Statement Lines from payments (money received) ──
      const bank = payments.map((p, i) => ({
        id: `pay-${p.id || i}`,
        date: String(p.payment_date || p.created_at || "").slice(0, 10),
        desc: `Payment received — ${p.payment_mode || "Bank Transfer"}`,
        ref: p.reference || p.transaction_id || "",
        amount: Number(p.amount || 0),
        matched: false,
        type: "payment",
      }));

      // Fallback to localStorage if both APIs returned nothing
      if (ledger.length === 0 && bank.length === 0) {
        const localBills = JSON.parse(localStorage.getItem("smrt_sales_bills") || "[]");
        const localPay   = JSON.parse(localStorage.getItem("smrt_payments")    || "[]");

        const localLedger = localBills.map((b, i) => ({
          id: `lb-${i}`,
          date: String(b.issue_date || b.date || "").slice(0, 10),
          desc: `Bill ${b.invoice_number || b.bill_number || `#${i + 1}`} — ${b.customer_name || "Customer"}`,
          ref: b.invoice_number || b.bill_number || "",
          amount: Number(b.grand_total || b.amount || 0),
          reconciled: b.status === "paid",
          type: "invoice",
        }));

        const localBank = localPay.map((p, i) => ({
          id: `lp-${i}`,
          date: String(p.payment_date || "").slice(0, 10),
          desc: `Payment — ${p.payment_mode || "Bank Transfer"}`,
          ref: p.reference || "",
          amount: Number(p.amount || 0),
          matched: false,
          type: "payment",
        }));

        setLedgerLines(localLedger);
        setBankLines(localBank);
      } else {
        setLedgerLines(ledger);
        setBankLines(bank);
      }
    } catch {
      addToast("Failed to load Bank Reconciliation data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [financialYear, month, branch, addToast]);

  useEffect(() => { load(); }, [load]);

  const [selectedLedger, setSelectedLedger] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  const handleMatch = () => {
    if (selectedLedger !== null && selectedBank !== null) {
      const ledgerObj = ledgerLines.find((l) => l.id === selectedLedger);
      const bankObj   = bankLines.find((b) => b.id === selectedBank);
      if (Math.abs(ledgerObj.amount) === Math.abs(bankObj.amount)) {
        setLedgerLines((prev) =>
          prev.map((l) => (l.id === selectedLedger ? { ...l, reconciled: true } : l))
        );
        setBankLines((prev) =>
          prev.map((b) => (b.id === selectedBank ? { ...b, matched: true } : b))
        );
        setSelectedLedger(null);
        setSelectedBank(null);
        addToast("Transactions successfully reconciled!", "success");
      } else {
        addToast("⚠️ Transaction amounts do not match! Cannot reconcile.", "warning");
      }
    }
  };

  // ── KPI calculations from real data ──────────────────────────────
  const totalInvoiced      = ledgerLines.reduce((s, l) => s + l.amount, 0);
  const totalReceived      = bankLines.reduce((s, b) => s + b.amount, 0);
  const unreconciledLedger = ledgerLines.filter((l) => !l.reconciled).reduce((s, x) => s + x.amount, 0);
  const unreconciledBank   = bankLines.filter((b) => !b.matched).reduce((s, x) => s + x.amount, 0);

  const filteredLedger = ledgerLines.filter((l) =>
    !search || l.desc.toLowerCase().includes(search.toLowerCase()) || l.ref.toLowerCase().includes(search.toLowerCase())
  );
  const filteredBank = bankLines.filter((b) =>
    !search || b.desc.toLowerCase().includes(search.toLowerCase()) || (b.ref || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── File upload / parse ──────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-upload of same file

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb   = XLSX.read(data, { type: "array", cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rows.length) {
          addToast("File is empty or could not be parsed.", "warning");
          return;
        }

        // Auto-detect columns: date, description, amount/debit/credit
        const sample   = rows[0];
        const keys     = Object.keys(sample);
        const dateKey  = keys.find((k) => /date/i.test(k)) || keys[0];
        const descKey  = keys.find((k) => /desc|narr|particular|detail|remark/i.test(k)) || keys[1];
        const amtKey   = keys.find((k) => /amount|credit|debit|withdrawl|deposit/i.test(k)) || keys[2];
        const refKey   = keys.find((k) => /ref|txn|chq|cheque|trans/i.test(k));

        const parsed = rows.map((row, i) => {
          const rawAmt = Number(String(row[amtKey] || "0").replace(/[^\d.-]/g, "")) || 0;
          return {
            id:      `upload-${i}`,
            date:    row[dateKey] instanceof Date
                       ? row[dateKey].toISOString().slice(0, 10)
                       : String(row[dateKey] || "").slice(0, 10),
            desc:    String(row[descKey] || `Transaction ${i + 1}`),
            ref:     refKey ? String(row[refKey] || "") : "",
            amount:  rawAmt,
            matched: false,
            type:    "upload",
          };
        }).filter((r) => r.amount !== 0);

        if (!parsed.length) {
          addToast("No valid transactions found. Check column names (Date, Description, Amount).", "warning");
          return;
        }

        setUploadPreview({ rows: parsed, fileName: file.name });
      } catch (err) {
        console.error(err);
        addToast("Failed to parse file. Ensure it is a valid CSV or Excel file.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmUpload = () => {
    if (!uploadPreview) return;
    setBankLines((prev) => [
      ...uploadPreview.rows,
      ...prev.filter((b) => b.type !== "upload"), // replace previous upload
    ]);
    addToast(`${uploadPreview.rows.length} transactions imported from "${uploadPreview.fileName}".`, "success");
    setUploadPreview(null);
  };

  if (loading) return <Loader label="Loading Bank Reconciliation..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-0 pb-0">Bank Reconciliation</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Verify company cash postings against monthly bank statements to ensure ledger integrity.</p>
        </div>
        <div className="flex gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all"
          >
            <Upload className="h-4 w-4 text-slate-400" />
            Upload Bank Statement
          </button>
          <button
            type="button"
            onClick={() => load({ isRefresh: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-all"
          >
            <RefreshCw className={`h-4 w-4 transition-transform duration-700 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* KPI Cards — all computed from real data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Books (Invoiced)" value={formatInr(totalInvoiced)} icon={FileSpreadsheet} color="bg-blue-600" />
        <KpiCard label="Bank (Received)" value={formatInr(totalReceived)} icon={CheckCircle} color="bg-green-600" />
        <KpiCard label="Ledger Unreconciled" value={formatInr(unreconciledLedger)} icon={HelpCircle} color="bg-amber-500" />
        <KpiCard label="Statement Unmatched" value={formatInr(unreconciledBank)} icon={HelpCircle} color="bg-red-500" />
      </div>

      {/* Difference banner */}
      {Math.abs(totalInvoiced - totalReceived) > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-sm font-semibold text-amber-800">
            Reconciliation Gap: {formatInr(Math.abs(totalInvoiced - totalReceived))}
            {totalInvoiced > totalReceived ? " (outstanding)" : " (excess received)"}
          </span>
          <span className="text-xs text-amber-600">{ledgerLines.filter(l => !l.reconciled).length} unreconciled entries</span>
        </div>
      )}

      <FinanceFilters
        search={search}
        onSearchChange={setSearch}
        financialYear={financialYear}
        onFinancialYearChange={setFinancialYear}
        month={month}
        onMonthChange={setMonth}
        branch={branch}
        onBranchChange={setBranch}
        searchPlaceholder="Search postings..."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Side: Ledger Cash Postings (from Invoices) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h2 className="font-bold text-slate-900">Ledger Cash Postings</h2>
              <p className="text-xs text-slate-400 mt-0.5">From invoices / bills issued</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Select to match</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredLedger.map((l) => (
              <div
                key={l.id}
                onClick={() => !l.reconciled && setSelectedLedger(l.id === selectedLedger ? null : l.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  l.reconciled
                    ? "bg-green-50/50 border-green-200 text-slate-400 cursor-default"
                    : selectedLedger === l.id
                    ? "border-[#2563EB] ring-2 ring-blue-100 bg-blue-50/20"
                    : "hover:bg-slate-50 bg-white border-slate-200"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-slate-400">{l.date || "—"}</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{l.desc}</p>
                  {l.ref && <span className="text-[10px] text-slate-400">Ref: {l.ref}</span>}
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className={`text-sm font-bold tabular-nums ${l.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                    {l.amount < 0 ? "-" : "+"}{formatInr(Math.abs(l.amount))}
                  </span>
                  {l.reconciled
                    ? <Check className="h-4 w-4 text-green-600 shrink-0" />
                    : selectedLedger === l.id && <X className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  }
                </div>
              </div>
            ))}
            {filteredLedger.length === 0 && (
              <div className="text-center p-8 text-slate-400">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No ledger postings found</p>
                <p className="text-xs mt-1">Create invoices in Sales → Bills to see entries here</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Bank Statement Lines (from Payments) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h2 className="font-bold text-slate-900">Bank Statement Lines</h2>
              <p className="text-xs text-slate-400 mt-0.5">From payments received</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Select to match</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredBank.map((b) => (
              <div
                key={b.id}
                onClick={() => !b.matched && setSelectedBank(b.id === selectedBank ? null : b.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  b.matched
                    ? "bg-green-50/50 border-green-200 text-slate-400 cursor-default"
                    : selectedBank === b.id
                    ? "border-[#2563EB] ring-2 ring-blue-100 bg-blue-50/20"
                    : "hover:bg-slate-50 bg-white border-slate-200"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-slate-400">{b.date || "—"}</span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{b.desc}</p>
                  {b.ref && <span className="text-[10px] text-slate-400">Ref: {b.ref}</span>}
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className={`text-sm font-bold tabular-nums ${b.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                    {b.amount < 0 ? "-" : "+"}{formatInr(Math.abs(b.amount))}
                  </span>
                  {b.matched
                    ? <Check className="h-4 w-4 text-green-600 shrink-0" />
                    : selectedBank === b.id && <X className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  }
                </div>
              </div>
            ))}
            {filteredBank.length === 0 && (
              <div className="text-center p-8 text-slate-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No bank statement transactions</p>
                <p className="text-xs mt-1">Record payments in Sales → Payments to see entries here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reconcile action bar */}
      {selectedLedger !== null && selectedBank !== null && (
        <div className="bg-[#2563EB] text-white rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div className="text-sm font-semibold">
            Ready to match selected ledger posting with bank statement item!
          </div>
          <button
            onClick={handleMatch}
            className="bg-white hover:bg-slate-100 text-blue-700 rounded-xl px-4 py-2 text-sm font-bold transition-all shadow-sm"
          >
            Confirm Reconciliation Match
          </button>
        </div>
      )}

      {/* ── Upload Preview Modal ─────────────────────────────────── */}
      {uploadPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <FileText className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Preview Bank Statement</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{uploadPreview.fileName} — {uploadPreview.rows.length} transactions detected</p>
                </div>
              </div>
              <button onClick={() => setUploadPreview(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info banner */}
            <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Columns auto-detected from your file. Date, Description, and Amount fields are mapped automatically.
            </div>

            {/* Table preview */}
            <div className="overflow-auto flex-1 mx-5 my-3 rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {["#", "Date", "Description", "Ref", "Amount (₹)"].map((h, i) => (
                      <th key={h} className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${i >= 4 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uploadPreview.rows.map((row, i) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400 text-xs font-mono">{i + 1}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{row.date || "—"}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium max-w-[200px] truncate">{row.desc}</td>
                      <td className="px-3 py-2 text-slate-400 text-xs">{row.ref || "—"}</td>
                      <td className={`px-3 py-2 text-right font-bold tabular-nums text-xs ${row.amount < 0 ? "text-red-600" : "text-green-700"}`}>
                        {row.amount < 0 ? "−" : "+"}{formatInr(Math.abs(row.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary + actions */}
            <div className="flex items-center justify-between border-t border-slate-100 p-5">
              <div className="text-sm text-slate-600">
                <span className="font-semibold">{uploadPreview.rows.length}</span> transactions &nbsp;·&nbsp; Total:{" "}
                <span className="font-bold text-green-700">{formatInr(uploadPreview.rows.reduce((s, r) => s + r.amount, 0))}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setUploadPreview(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <Check className="h-4 w-4" /> Import {uploadPreview.rows.length} Transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
>>>>>>> 7872881b74fcfb6e581ae019a9831f239bd44c90
}

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{value ?? 0}</p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function BankReconciliation() {
  const { addToast } = useToast();
  const uploadInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState("2026-27");
  const [month, setMonth] = useState("All Months");
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const [ledgerLines, setLedgerLines] = useState([]);
  const [bankLines, setBankLines] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  const persistState = useCallback(
    async (ledger, bank) => {
      try {
        await putTenantPref(PREF_KEY, {
          financialYear,
          month,
          branch,
          reconciled_ledger_ids: ledger.filter((l) => l.reconciled).map((l) => l.id),
          bank_lines: bank,
        });
      } catch {
        /* non-blocking */
      }
    },
    [financialYear, month, branch]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [repRes, prefRes] = await Promise.allSettled([
        getExtendedReports(financialYear, month, branch),
        getTenantPref(PREF_KEY),
      ]);
      const pref =
        prefRes.status === "fulfilled" ? prefRes.value?.data?.value || {} : {};
      const reconciled = new Set(pref.reconciled_ledger_ids || []);
      let ledger = [];
      if (repRes.status === "fulfilled" && repRes.value?.data) {
        ledger = (repRes.value.data.ledger_lines || []).map((l) => ({
          ...l,
          reconciled: reconciled.has(l.id) || Boolean(l.reconciled),
        }));
        setCashBalance(repRes.value.data.cash_balance || 0);
      }
      setLedgerLines(ledger);
      if (Array.isArray(pref.bank_lines) && pref.bank_lines.length) {
        setBankLines(pref.bank_lines);
      } else if (repRes.status === "fulfilled") {
        setBankLines(repRes.value?.data?.bank_lines || []);
      } else {
        setBankLines([]);
      }
    } catch {
      addToast("Failed to load Bank Reconciliation data", "error");
    } finally {
      setLoading(false);
    }
  }, [financialYear, month, branch, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMatch = async () => {
    if (selectedLedger === null || selectedBank === null) return;
    const ledgerObj = ledgerLines.find((l) => l.id === selectedLedger);
    const bankObj = bankLines.find((b) => b.id === selectedBank);
    if (!ledgerObj || !bankObj) return;
    if (Math.abs(ledgerObj.amount) !== Math.abs(bankObj.amount)) {
      addToast("Transaction amounts do not match — cannot reconcile.", "error");
      return;
    }
    const nextLedger = ledgerLines.map((l) =>
      l.id === selectedLedger ? { ...l, reconciled: true } : l
    );
    const nextBank = bankLines.map((b) =>
      b.id === selectedBank ? { ...b, matched: true } : b
    );
    setLedgerLines(nextLedger);
    setBankLines(nextBank);
    setSelectedLedger(null);
    setSelectedBank(null);
    await persistState(nextLedger, nextBank);
    addToast("Transactions successfully reconciled!", "success");
  };

  const handleUploadClick = () => uploadInputRef.current?.click();

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseStatementCsv(text);
      if (!parsed.length) {
        addToast("Could not parse statement. Use CSV: date, description, amount", "error");
        return;
      }
      setBankLines(parsed);
      await persistState(ledgerLines, parsed);
      addToast(`Imported ${parsed.length} bank statement lines from ${file.name}`, "success");
    } catch (err) {
      addToast(apiErrorMessage(err, "Failed to upload statement"), "error");
    }
  };

  const unreconciledLedger = ledgerLines
    .filter((l) => !l.reconciled)
    .reduce((s, x) => s + x.amount, 0);
  const unreconciledBank = bankLines
    .filter((b) => !b.matched)
    .reduce((s, x) => s + x.amount, 0);

  const q = search.trim().toLowerCase();
  const visibleLedger = !q
    ? ledgerLines
    : ledgerLines.filter((l) =>
        `${l.description || ""} ${l.date || ""}`.toLowerCase().includes(q)
      );
  const visibleBank = !q
    ? bankLines
    : bankLines.filter((b) =>
        `${b.description || ""} ${b.date || ""}`.toLowerCase().includes(q)
      );

  if (loading) return <Loader label="Loading Bank Reconciliation..." />;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-0 pb-0">Bank Reconciliation</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Verify company cash postings against monthly bank statements to ensure ledger integrity.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUploadClick}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all"
          >
            <Upload className="h-4 w-4 text-slate-400" />
            Upload Bank statement
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleUploadFile}
          />
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <FinanceFilters
        financialYear={financialYear}
        onFinancialYearChange={setFinancialYear}
        month={month}
        onMonthChange={setMonth}
        branch={branch}
        onBranchChange={setBranch}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Cash Balance" value={formatInr(cashBalance)} icon={CheckCircle} color="bg-emerald-500" />
        <KpiCard label="Ledger Unreconciled" value={formatInr(unreconciledLedger)} icon={HelpCircle} color="bg-amber-500" />
        <KpiCard label="Statement Unreconciled" value={formatInr(unreconciledBank)} icon={HelpCircle} color="bg-red-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Ledger Postings</h2>
            <span className="text-xs font-semibold text-slate-500">Select to match</span>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {visibleLedger.map((l) => (
              <button
                key={l.id}
                type="button"
                disabled={l.reconciled}
                onClick={() => !l.reconciled && setSelectedLedger(l.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm ${
                  l.reconciled
                    ? "cursor-default border-green-200 bg-green-50/50 text-slate-400"
                    : selectedLedger === l.id
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.description || "Ledger entry"}</p>
                  <p className="text-xs text-slate-500">{l.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums font-semibold">{formatInr(l.amount)}</span>
                  {l.reconciled && <Check className="h-4 w-4 shrink-0 text-green-600" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Bank Statement</h2>
            <span className="text-xs font-semibold text-slate-500">Select to match</span>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {visibleBank.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No bank statement transactions uploaded
              </div>
            ) : (
              visibleBank.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={b.matched}
                  onClick={() => !b.matched && setSelectedBank(b.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm ${
                    b.matched
                      ? "cursor-default border-green-200 bg-green-50/50 text-slate-400"
                      : selectedBank === b.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.description || "Bank line"}</p>
                    <p className="text-xs text-slate-500">{b.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-semibold">{formatInr(b.amount)}</span>
                    {b.matched && <Check className="h-4 w-4 shrink-0 text-green-600" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedLedger !== null && selectedBank !== null ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            Ready to match selected ledger posting with bank statement item!
          </p>
          <button
            type="button"
            onClick={handleMatch}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Confirm Match
          </button>
        </div>
      ) : null}
    </div>
  );
}
