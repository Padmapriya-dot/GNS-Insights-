import { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as XLSX from "xlsx";
import { Factory, IndianRupee, Package, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import ExportButtons from "../../components/finance/ExportButtons";
import FinanceFilters from "../../components/finance/FinanceFilters";
import Loader from "../../components/common/Loader";
import { getProfitLossExtended } from "../../api/accountsApi";
import { formatInr } from "../../data/financeMasterData";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p>
        </div>
        {Icon && <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5 text-white" /></div>}
      </div>
    </div>
  );
}

function EmptyChart({ message = "No data yet" }) {
  return <div className="flex h-full items-center justify-center text-sm text-slate-400">{message}</div>;
}

const EMPTY_PL = {
  revenue: 0, gross_profit: 0, net_profit: 0, ebitda: 0,
  operating_cost: 0, manufacturing_cost: 0, inventory_cost: 0,
  monthly_revenue: [], expense_trend: [], profit_trend: [],
  revenue_vs_expense: [], department_cost: [], factory_cost: [],
  revenue_rows: [], expense_rows: [],
  total_revenue: 0, total_expenses: 0,
};

export default function ProfitLoss() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [month, setMonth] = useState("All Months");
  const [branch, setBranch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProfitLossExtended(year);
      const api = res?.data;
      setData(api && typeof api === "object" ? { ...EMPTY_PL, ...api } : EMPTY_PL);
    } catch {
      setData(EMPTY_PL);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportExcel = () => {
    const rows = [
      ["Profit & Loss", year],
      ["Revenue", data.revenue], ["Gross Profit", data.gross_profit], ["Net Profit", data.net_profit],
      ["EBITDA", data.ebitda], ["Operating Cost", data.operating_cost],
      ["Manufacturing Cost", data.manufacturing_cost], ["Inventory Cost", data.inventory_cost],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
    XLSX.writeFile(wb, `Profit_Loss_${year}.xlsx`);
  };

  if (loading && !data) return <Loader label="Loading Profit & Loss..." />;

  const revenueRows = data?.revenue_rows || [];
  const expenseRows = data?.expense_rows || [];
  const hasTableData = revenueRows.length > 0 || expenseRows.length > 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profit & Loss {year}</h1>
          <p className="mt-1 text-sm text-slate-500">Revenue, manufacturing cost, department analysis, and profit trends.</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons onExcel={exportExcel} />
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Revenue" value={formatInr(data?.revenue)} icon={TrendingUp} color="bg-blue-600" />
        <KpiCard label="Gross Profit" value={formatInr(data?.gross_profit)} icon={Wallet} color="bg-green-600" />
        <KpiCard label="Net Profit" value={formatInr(data?.net_profit)} icon={IndianRupee} color="bg-emerald-600" />
        <KpiCard label="EBITDA" value={formatInr(data?.ebitda)} icon={TrendingUp} color="bg-indigo-600" />
        <KpiCard label="Operating Cost" value={formatInr(data?.operating_cost)} icon={TrendingDown} color="bg-amber-500" />
        <KpiCard label="Manufacturing Cost" value={formatInr(data?.manufacturing_cost)} icon={Factory} color="bg-orange-500" />
        <KpiCard label="Inventory Cost" value={formatInr(data?.inventory_cost)} icon={Package} color="bg-purple-600" />
      </div>

      <FinanceFilters
        search={search} onSearchChange={setSearch}
        financialYear={financialYear} onFinancialYearChange={setFinancialYear}
        month={month} onMonthChange={setMonth}
        branch={branch} onBranchChange={setBranch}
        searchPlaceholder="Search category, department..."
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {[2026, 2025, 2024, 2023].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </FinanceFilters>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Monthly Revenue</h2>
          <div className="h-48">
            {(data?.monthly_revenue || []).some((m) => m.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatInr(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatInr(v)} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No revenue data yet" />}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Expense Trend</h2>
          <div className="h-48">
            {(data?.expense_trend || []).some((m) => m.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.expense_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatInr(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatInr(v)} />
                  <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No expense data yet" />}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Profit Trend</h2>
          <div className="h-48">
            {(data?.profit_trend || []).some((m) => m.amount !== 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.profit_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatInr(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatInr(v)} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No profit data yet" />}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Revenue vs Expense</h2>
          <div className="h-48">
            {(data?.revenue_vs_expense || []).some((m) => m.revenue > 0 || m.expense > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenue_vs_expense}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatInr(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatInr(v)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#2563EB" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No revenue or expense data yet" />}
          </div>
        </div>

        {(data?.department_cost || []).length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Department Cost</h2>
            <ul className="space-y-2">
              {data.department_cost.map((d) => (
                <li key={d.name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium">{d.name}</span>
                  <span className="font-semibold text-[#2563EB]">{formatInr(d.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(data?.factory_cost || []).length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Factory Cost Analysis</h2>
            <ul className="space-y-2">
              {data.factory_cost.map((d) => (
                <li key={d.name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium">{d.name}</span>
                  <span className="font-semibold text-[#2563EB]">{formatInr(d.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {hasTableData ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
          <h2 className="mb-4 font-semibold text-slate-900">Detailed P&L Table</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left">Category</th>
                {MONTHS.map((m) => <th key={m} className="border border-slate-200 p-2 text-right">{m}</th>)}
                <th className="border border-slate-200 p-2 text-right">FY</th>
              </tr>
            </thead>
            <tbody>
              {revenueRows.map((r) => (
                <tr key={r.category}>
                  <td className="border border-slate-200 p-2">{r.category}</td>
                  {MONTHS.map((m) => <td key={m} className="border border-slate-200 p-2 text-right">{formatInr(r[m.toLowerCase()]) || "—"}</td>)}
                  <td className="border border-slate-200 p-2 text-right font-semibold">{formatInr(r.fy) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Detailed monthly breakdown will appear when revenue/expense entries are recorded.
        </div>
      )}
    </div>
  );
}
