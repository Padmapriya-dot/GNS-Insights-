import { useEffect, useState, useCallback } from "react";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/ToastContext";
import { getExtendedReports } from "../../api/accountsApi";
import { formatInr } from "../../data/financeMasterData";

function formatAmount(value) {
  return formatInr(value ?? 0);
}

export default function BalanceSheet() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState("2026-27");
  const [month, setMonth] = useState("All Months");
  const [branch, setBranch] = useState("");
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

  const liabilityLabels = [
    "Capital Account",
    "Retained Earnings (Reserves & Surplus)",
    "Reserves & Surplus",
    "Loans (Liability)",
    "Bank OCC A/c (Bank OD A/c)",
    "Secured Loans",
    "Unsecured Loans",
    "Current Liabilities",
    "Duties & Taxes",
    "Provisions",
    "Sundry Creditors",
    "Branch / Divisions",
    "BRANCH NOIDA",
    "HEAD OFFICE STICON",
    "Profit & Loss A/c",
    "Opening Balance",
    "Current Period",
  ];

  const assetLabels = [
    "FIXED ASSET",
    "CAPITAL WORK IN PROGRESS",
    "CIVILWORKS COST",
    "COMPUTER & LAPTOP",
    "Fixed Asset -21-22",
    "FURNITURE & FIXTURE",
    "IMMOVABLE PROPERTY",
    "LAB EQUIPMENT",
    "Land Level Works Cost",
    "PLANT & MACHINERY",
    "VEHICLES",
    "Depreciation Reserve",
    "Inverter -Amaraon",
    "Current Assets",
    "Closing Stock",
    "Deposits (Asset)",
    "Loans & Advances (Asset)",
    "Sundry Debtors",
    "Cash-in-Hand",
    "Bank Accounts",
    "Advances",
    "RENT -ADVANCE",
    "SALARY ADVANCES",
    "Staff Advances",
    "Capital Subsidy Receivable",
    "GST ON RCM",
    "Suspense A/c",
    "Suspense A/c",
    "Miscellaneous Expenses Written Off",
    "Preoperative Expenses - 21-22",
    "Raw Material",
    "Raw Material",
  ];

  const normalizeLabel = (value) =>
    String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const labelAlias = {
    capitalaccount: "equitysharecapital",
    retainedearningsreservesurplus: "retainedearnings",
    reservesurplus: "retainedearnings",
    loansliability: "longtermbankborrowings",
    bankocca: "cashcashequivalents",
    bankodacca: "cashcashequivalents",
    securedloans: "longtermbankborrowings",
    unsecuredloans: "longtermbankborrowings",
    currentliabilities: "totalcurrentliabilities",
    dutiesandtaxes: "accruedliabilitiestaxes",
    sundrycreditors: "accountspayable",
    profitandlossac: "retainedearnings",
    fixedasset: "plantmachinerynetbookvalue",
    plantmachinery: "plantmachinerynetbookvalue",
    closingstock: "inventoryvaluationfinished",
    sundrydebtors: "accountsreceivable",
    cashinhand: "cashcashequivalents",
    bankaccounts: "cashcashequivalents",
    currentassets: "totalcurrentassets",
    rawmaterial: "inventoryvaluationraw",
  };

  const allRows = [
    ...data.assets_current,
    ...data.assets_non_current,
    ...data.liabilities_current,
    ...data.liabilities_non_current,
    ...data.equity,
  ];

  const boldLabels = new Set([
    "capital account",
    "current liabilities",
    "branch / divisions",
    "branch noida",
    "head office sticon",
    "profit & loss a/c",
    "fixed asset",
    "current assets",
    "raw material",
  ]);

  const findAmount = (label, index) => {
    const normalized = normalizeLabel(label);

    const exactMatch = allRows.find((row) => normalizeLabel(row.name) === normalized);
    if (exactMatch) return formatAmount(exactMatch.amount);

    const aliasKey = labelAlias[normalized];
    if (aliasKey) {
      if (aliasKey === "totalcurrentassets") {
        return formatAmount(data.assets_current.reduce((sum, row) => sum + (row.amount || 0), 0));
      }
      if (aliasKey === "totalcurrentliabilities") {
        return formatAmount(data.liabilities_current.reduce((sum, row) => sum + (row.amount || 0), 0));
      }
      if (aliasKey === "inventoryvaluationraw") {
        const rawRows = data.assets_current.filter((row) => normalizeLabel(row.name).includes("inventoryvaluation") && normalizeLabel(row.name).includes("raw"));
        const rawRow = rawRows[0];
        return rawRow ? formatAmount(rawRow.amount) : "";
      }
      const aliasMatch = allRows.find((row) => normalizeLabel(row.name) === aliasKey);
      if (aliasMatch) return formatAmount(aliasMatch.amount);
    }

    const partialMatch = allRows.find((row) => {
      const rowNorm = normalizeLabel(row.name);
      return rowNorm.includes(normalized) || normalized.includes(rowNorm);
    });
    if (partialMatch) return formatAmount(partialMatch.amount);

    return "";
  };

  const rowCount = Math.max(liabilityLabels.length, assetLabels.length);
  const totalLiabilitiesAndEquity = data.total_liabilities + data.total_equity;

  const months = [
    "All Months",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
  ];
  const financialYears = ["2026-27", "2025-26", "2024-25", "2023-24"];
  const branches = ["", "Head Office", "Plant-1"];

  const getPeriodLabel = () => {
    if (month === "All Months") return financialYear;
    return `${financialYear}, ${month}`;
  };

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

  if (loading) return <Loader label="Loading Balance Sheet..." />;

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-sm text-slate-500">{getPeriodLabel()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <label className="text-slate-600">Financial Year</label>
            <select value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm">
              {financialYears.map((fy) => <option key={fy} value={fy}>{fy}</option>)}
            </select>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <label className="text-slate-600">Month</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm">
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <label className="text-slate-600">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm">
              {branches.map((b) => <option key={b} value={b}>{b || "All Branches"}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-3xl border border-slate-300 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-600 bg-slate-100 px-3 py-2 text-left uppercase tracking-[0.1em]">Liabilities + Equity</th>
              <th className="border border-slate-600 bg-slate-100 px-3 py-2 text-right">as at 28-Jul-26</th>
              <th className="border border-slate-600 bg-slate-100 px-3 py-2 text-left uppercase tracking-[0.1em]">Assets</th>
              <th className="border border-slate-600 bg-slate-100 px-3 py-2 text-right">as at 28-Jul-26</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, index) => {
              const liabilityLabel = liabilityLabels[index] || "";
              const assetLabel = assetLabels[index] || "";
              const liabilityBold = boldLabels.has(liabilityLabel.toLowerCase());
              const assetBold = boldLabels.has(assetLabel.toLowerCase());
              return (
                <tr key={`row-${index}`} className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                  <td className={`border border-slate-600 px-3 py-2 ${liabilityBold ? "font-semibold" : "text-slate-900"}`}>
                    {liabilityLabel}
                  </td>
                  <td className="border border-slate-600 px-3 py-2 text-right text-slate-900">
                    {liabilityLabel ? findAmount(liabilityLabel, index) : ""}
                  </td>
                  <td className={`border border-slate-600 px-3 py-2 ${assetBold ? "font-semibold" : "text-slate-900"}`}>
                    {assetLabel}
                  </td>
                  <td className="border border-slate-600 px-3 py-2 text-right text-slate-900">
                    {assetLabel ? findAmount(assetLabel, index) : ""}
                  </td>
                </tr>
              );
            })}

            <tr className="bg-slate-200 font-semibold">
              <td className="border border-slate-600 px-3 py-2">Total Liabilities + Equity</td>
              <td className="border border-slate-600 px-3 py-2 text-right">{formatAmount(totalLiabilitiesAndEquity)}</td>
              <td className="border border-slate-600 px-3 py-2">Total Assets</td>
              <td className="border border-slate-600 px-3 py-2 text-right">{formatAmount(data.total_assets)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
