import { useEffect, useState, useCallback } from "react";
import { Landmark, RefreshCw, Download, Wallet, ShieldCheck, PieChart as ChartIcon } from "lucide-react";
import * as XLSX from "xlsx";
import FinanceFilters from "../../components/finance/FinanceFilters";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getExtendedReports } from "../../api/accountsApi";
import { formatInr } from "../../data/financeMasterData";

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
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

export default function BalanceSheet() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState("2026-27");
  const [month, setMonth] = useState("All Months");
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState({
    assets_current: [],
    assets_non_current: [],
    liabilities_current: [],
    liabilities_non_current: [],
    equity: [],
    total_assets: 0,
    total_liabilities: 0,
    total_equity: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExtendedReports(financialYear, month, branch);
      if (res.data) setData(res.data);
    } catch {
      addToast("Failed to load Balance Sheet data", "error");
    } finally {
      setLoading(false);
    }
  }, [financialYear, month, branch, addToast]);

  useEffect(() => { load(); }, [load]);

  const totalCurrentAssets = data.assets_current.reduce((s, x) => s + x.amount, 0);
  const totalNonCurrentAssets = data.assets_non_current.reduce((s, x) => s + x.amount, 0);
  const totalAssets = data.total_assets;
  const totalCurrentLiabilities = data.liabilities_current.reduce((s, x) => s + x.amount, 0);
  const totalNonCurrentLiabilities = data.liabilities_non_current.reduce((s, x) => s + x.amount, 0);
  const totalLiabilities = data.total_liabilities;
  const totalEquity = data.total_equity;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const exportExcel = () => {
    const wsData = [
      ["GNS Insights - BALANCE SHEET", `${financialYear} (${month})`],
      ["Branch:", branch || "Consolidated"],
      [],
      ["ASSETS", "", "LIABILITIES & EQUITY"],
      ["Current Assets", "", "Current Liabilities"],
      ...data.assets_current.map((a, i) => {
        const l = data.liabilities_current[i] || { name: "", amount: "" };
        return [a.name, a.amount, l.name, l.amount];
      }),
      ["Total Current Assets", totalCurrentAssets, "Total Current Liabilities", totalCurrentLiabilities],
      [],
      ["Non-Current Assets", "", "Non-Current Liabilities"],
      ...data.assets_non_current.map((a, i) => {
        const l = data.liabilities_non_current[i] || { name: "", amount: "" };
        return [a.name, a.amount, l.name, l.amount];
      }),
      ["Total Non-Current Assets", totalNonCurrentAssets, "Total Non-Current Liabilities", totalNonCurrentLiabilities],
      [],
      ["", "", "Equity"],
      ...data.equity.map((eq) => ["", "", eq.name, eq.amount]),
      ["", "", "Total Equity", totalEquity],
      [],
      ["TOTAL ASSETS", totalAssets, "TOTAL LIABILITIES & EQUITY", totalLiabilitiesAndEquity],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");
    XLSX.writeFile(wb, `Balance_Sheet_${financialYear}.xlsx`);
  };

  const filter = (arr) => arr.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader label="Loading Balance Sheet..." />;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="mt-1 text-base text-slate-500">Assets, liabilities, and owner equity overview for capital structure tracking.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-400" /> Excel
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Assets" value={formatInr(totalAssets)} icon={Landmark} color="bg-blue-600" />
        <KpiCard label="Total Liabilities" value={formatInr(totalLiabilities)} icon={Wallet} color="bg-red-500" />
        <KpiCard label="Total Equity" value={formatInr(totalEquity)} icon={ShieldCheck} color="bg-green-600" />
        <KpiCard label="Net Worth" value={formatInr(totalAssets - totalLiabilities)} icon={ChartIcon} color="bg-indigo-600" />
      </div>

      <FinanceFilters
        search={search} onSearchChange={setSearch}
        financialYear={financialYear} onFinancialYearChange={setFinancialYear}
        month={month} onMonthChange={setMonth}
        branch={branch} onBranchChange={setBranch}
        searchPlaceholder="Search accounts..."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assets */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3">ASSETS</h2>

          <div>
            <h3 className="text-base font-semibold text-slate-700 mb-3 uppercase tracking-[0.18em]">Current Assets</h3>
            <table className="min-w-full text-base">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-4 text-left font-semibold">Account Category</th>
                  <th className="p-4 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filter(data.assets_current).map((a) => (
                  <tr key={a.name} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-700">{a.name}</td>
                    <td className="p-4 text-right font-semibold text-slate-900">{formatInr(a.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-blue-50/50 font-semibold text-slate-900">
                  <td className="p-4">Total Current Assets</td>
                  <td className="p-4 text-right">{formatInr(totalCurrentAssets)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-700 mb-3 uppercase tracking-[0.18em]">Non-Current Assets</h3>
            <table className="min-w-full text-base">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-4 text-left font-semibold">Account Category</th>
                  <th className="p-4 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filter(data.assets_non_current).map((a) => (
                  <tr key={a.name} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-700">{a.name}</td>
                    <td className="p-4 text-right font-semibold text-slate-900">{formatInr(a.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-blue-50/50 font-semibold text-slate-900">
                  <td className="p-4">Total Non-Current Assets</td>
                  <td className="p-4 text-right">{formatInr(totalNonCurrentAssets)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-blue-600 text-white rounded-2xl p-5 font-semibold shadow-md">
            <span className="text-base">TOTAL ASSETS</span>
            <span className="text-base">{formatInr(totalAssets)}</span>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3">LIABILITIES & EQUITY</h2>

          <div>
            <h3 className="text-base font-semibold text-slate-700 mb-3 uppercase tracking-[0.18em]">Current Liabilities</h3>
            <table className="min-w-full text-base">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-4 text-left font-semibold">Account Category</th>
                  <th className="p-4 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filter(data.liabilities_current).map((l) => (
                  <tr key={l.name} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-700">{l.name}</td>
                    <td className="p-4 text-right font-semibold text-slate-900">{formatInr(l.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-red-50/50 font-semibold text-slate-900">
                  <td className="p-4">Total Current Liabilities</td>
                  <td className="p-4 text-right">{formatInr(totalCurrentLiabilities)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-700 mb-3 uppercase tracking-[0.18em]">Non-Current Liabilities</h3>
            <table className="min-w-full text-base">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-4 text-left font-semibold">Account Category</th>
                  <th className="p-4 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filter(data.liabilities_non_current).map((l) => (
                  <tr key={l.name} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-700">{l.name}</td>
                    <td className="p-4 text-right font-semibold text-slate-900">{formatInr(l.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-red-50/50 font-semibold text-slate-900">
                  <td className="p-4">Total Non-Current Liabilities</td>
                  <td className="p-4 text-right">{formatInr(totalNonCurrentLiabilities)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-700 mb-3 uppercase tracking-[0.18em]">Owner's Equity</h3>
            <table className="min-w-full text-base">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-4 text-left font-semibold">Equity Account</th>
                  <th className="p-4 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filter(data.equity).map((eq) => (
                  <tr key={eq.name} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-700">{eq.name}</td>
                    <td className="p-4 text-right font-semibold text-slate-900">{formatInr(eq.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-green-50/50 font-semibold text-slate-900">
                  <td className="p-4">Total Equity</td>
                  <td className="p-4 text-right">{formatInr(totalEquity)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-blue-600 text-white rounded-2xl p-5 font-semibold shadow-md">
            <span className="text-base">TOTAL LIABILITIES & EQUITY</span>
            <span className="text-base">{formatInr(totalLiabilitiesAndEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
