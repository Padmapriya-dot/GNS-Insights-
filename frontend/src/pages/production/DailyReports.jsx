import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileDown, FileSpreadsheet } from "lucide-react";

import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import { getDailyReports } from "../../api/productionApi";
import { exportToExcel, exportToPdf } from "../../utils/exportUtils";
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

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const params = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        const response = await getDailyReports(tenantId, params);
        setReports(response.data || []);
      } catch (error) {
        console.error("Failed to load daily reports", error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [dateFrom, dateTo]);

  const columns = [
    { key: "report_date", label: t("dashboard.date"), render: (r) => formatDate(r.report_date) },
    { key: "product_id", label: t("dashboard.product") },
    { key: "work_order_id", label: t("production.workOrder") },
    { key: "machine_id", label: t("production.machine") },
    { key: "produced_quantity", label: t("dashboard.produced") },
    { key: "scrap_quantity", label: t("dashboard.scrap") },
    { key: "downtime_minutes", label: t("dashboard.downtime") },
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
        <DataTable
          columns={columns}
          data={reports}
          searchPlaceholder={t("common.search")}
          searchKeys={["report_date", "product_id", "work_order_id"]}
          emptyState={emptyState}
        />
      </div>
    </div>
  );
}