import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FileDown, FileSpreadsheet } from "lucide-react";

import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import { getDailyReports, getProductionOrders } from "../../api/productionApi";
import { enrichApiOrder } from "../../data/productionPlanningMasterData";
import { exportToExcel, exportToPdf } from "../../utils/exportUtils";
import useManufacturingRefresh from "../../hooks/useManufacturingRefresh";
import useTenantId from "../../hooks/useTenantId";

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function DailyReports() {
  const tenantId = useTenantId();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const [reportsRes, ordersRes] = await Promise.all([
        getDailyReports(tenantId, params).catch(() => ({ data: [] })),
        getProductionOrders().catch(() => ({ data: [] })),
      ]);

      let list = reportsRes.data || [];
      const apiOrders = ordersRes.data || [];
      let localOrders = [];
      try {
        const stored = localStorage.getItem("smrt_local_production_orders");
        if (stored) localOrders = JSON.parse(stored);
      } catch (e) {}

      const allOrders = [...localOrders, ...apiOrders];

      list = list.map((rep) => {
        let p = Number(rep.produced_quantity ?? rep.actual_quantity ?? 0);
        let g = Number(rep.good_qty ?? rep.good_quantity ?? 0);
        let r = Number(rep.reject_qty ?? rep.scrap_quantity ?? 0);

        if (p <= 0) {
          const match = allOrders.find(
            (o) =>
              o.order_number === rep.work_order_number ||
              `WO-${o.order_number}` === rep.work_order_number ||
              `WO-P0-${o.id}` === rep.work_order_number ||
              `PO-${o.id}` === rep.work_order_number ||
              (o.product_name && rep.product_name && o.product_name.toLowerCase().trim() === rep.product_name.toLowerCase().trim())
          );
          if (match) {
            const matchEnriched = enrichApiOrder(match);
            p = Number(matchEnriched.produced_quantity ?? matchEnriched.actual_quantity ?? 0);
            g = Number(matchEnriched.good_qty ?? matchEnriched.good_quantity ?? 0);
            r = Number(matchEnriched.reject_qty ?? matchEnriched.scrap_quantity ?? 0);
          }
        }

      const calc = p > 0 ? p : (g + r > 0 ? g + r : rep.produced_quantity);
        return {
          ...rep,
          produced_quantity: calc != null && calc > 0 ? calc : rep.produced_quantity,
          good_qty: g > 0 ? g : (calc > 0 ? calc - r : 0),
          scrap_quantity: r > 0 ? r : rep.scrap_quantity,
        };
      });

      // Sync good_qty from reports back to localStorage production orders
      try {
        const stored = localStorage.getItem("smrt_local_production_orders");
        if (stored && list.length > 0) {
          let localPOs = JSON.parse(stored);
          let changed = false;
          list.forEach((rep) => {
            const g = Number(rep.good_qty ?? 0);
            const p = Number(rep.produced_quantity ?? 0);
            if (g > 0 || p > 0) {
              localPOs = localPOs.map((po) => {
                const nameMatch = po.product_name && rep.product_name &&
                  po.product_name.toLowerCase().trim() === rep.product_name.toLowerCase().trim();
                const orderMatch = po.order_number === rep.work_order_number ||
                  `WO-${po.order_number}` === rep.work_order_number;
                if (nameMatch || orderMatch) {
                  changed = true;
                  return {
                    ...po,
                    good_qty: Math.max(Number(po.good_qty ?? 0), g),
                    produced_quantity: Math.max(Number(po.produced_quantity ?? 0), p > 0 ? p : g),
                  };
                }
                return po;
              });
            }
          });
          if (changed) {
            localStorage.setItem("smrt_local_production_orders", JSON.stringify(localPOs));
          }
        }
      } catch (e) {}

      setReports(list);
    } catch (error) {
      console.error("Failed to load daily reports", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, dateFrom, dateTo]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useManufacturingRefresh(loadReports);

  const columns = [
    { key: "report_date", label: t("dashboard.date"), render: (r) => formatDate(r.report_date) },
    { key: "product_name", label: t("dashboard.product"), render: (r) => r.product_name || r.product_id || "—" },
    { key: "work_order_number", label: t("production.workOrder"), render: (r) => r.work_order_number || r.work_order_id || "—" },
    { key: "machine_name", label: t("production.machine"), render: (r) => r.machine_name || r.machine_id || "—" },
    { key: "shift", label: "Shift", render: (r) => typeof r.shift === "object" ? (r.shift?.label || r.shift?.id || "—") : (r.shift || "—") },
    { key: "operator_name", label: "Operator", render: (r) => r.operator_name || "—" },
    { key: "planned_quantity", label: "Planned Quantity", render: (r) => (r.planned_quantity != null ? r.planned_quantity : "—") },
    {
      key: "produced_quantity",
      label: t("dashboard.produced"),
      render: (r) => {
        const planned = Number(r.planned_quantity || 0);
        const prod = Number(r.produced_quantity ?? r.actual_quantity ?? 0);
        const good = Number(r.good_qty ?? r.good_quantity ?? r.accepted_quantity ?? 0);
        const reject = Number(r.scrap_quantity ?? r.reject_qty ?? r.rejected_quantity ?? 0);
        if (prod > 0) return prod;
        if (good > 0 || reject > 0) return good + reject;
        if (r.status === "completed" || r.status === "closed" || r.status === "done") return planned;
        return prod;
      },
    },
    { key: "scrap_quantity", label: t("dashboard.scrap"), render: (r) => r.scrap_quantity ?? 0 },
    { key: "downtime_minutes", label: t("dashboard.downtime"), render: (r) => (r.downtime_minutes ? `${r.downtime_minutes} min` : "0 min") },
    { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
  ];

  const emptyState = (
    <EmptyState
      icon="chart"
      title={t("production.noDataAvailable")}
      description={t("production.noDailyReports")}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("production.dailyReports")}
        subtitle={t("production.dailyReportsSubtitle")}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          />
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => exportToExcel(reports, columns, "daily-reports")}
              disabled={!reports.length}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => exportToPdf(reports, columns, "Daily Production Reports", "daily-reports")}
              disabled={!reports.length}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <Loader label="Loading daily production reports..." />
        ) : (
          <DataTable
            columns={columns}
            data={reports}
            searchPlaceholder={t("common.search")}
            searchKeys={["report_date", "product_name", "work_order_number", "machine_name", "operator_name", "notes"]}
            emptyState={emptyState}
          />
        )}
      </div>
    </div>
  );
}