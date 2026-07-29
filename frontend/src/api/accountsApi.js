import api from "./axiosConfig";

export const getAccountsDashboard = () => api.get("/accounts/dashboard");

export const getFinanceHub = () => api.get("/accounts/hub");

export const getAPSummary = () => api.get("/accounts/ap/summary");
export const getAPEnriched = () => api.get("/accounts/ap/enriched");

export const getARSummary = () => api.get("/accounts/ar/summary");
export const getAREnriched = () => api.get("/accounts/ar/enriched");

export const getPaymentSummary = () => api.get("/accounts/payments/summary");
export const getPaymentsEnriched = () => api.get("/accounts/payments/enriched");

export const getGLSummary = () => api.get("/accounts/gl/summary");
export const getGLEnriched = () => api.get("/accounts/gl/enriched");

export const getProfitLoss = (_tenantId, year, ytdMonth = 12) =>
  api.get("/accounts/profit-loss", {
    params: { year, ytd_month: ytdMonth },
  });

export const getProfitLossExtended = (year) =>
  api.get("/accounts/profit-loss/extended", { params: { year } });

export const getTaxReport = (_tenantId, year) =>
  api.get("/accounts/tax-report", {
    params: { year },
  });

export const getGSTExtended = (year, month, branch) =>
  api.get("/accounts/gst/extended", {
    params: { year, month: month || undefined, branch: branch || undefined },
  });

export const listIncome = (_tenantId, year = null) =>
  api.get("/accounts/income", {
    params: { year },
  });

export const listExpenses = (_tenantId, year = null) =>
  api.get("/accounts/expenses", {
    params: { year },
  });

export const createIncome = (payload) => api.post("/accounts/income", payload);
export const createExpense = (payload) => api.post("/accounts/expenses", payload);

/** Extended finance reports (Balance Sheet, Trial Balance, Journals, Assets, etc.). */
export const getExtendedReports = (financialYear, month, branch) =>
  api.get("/accounts/extended-reports", {
    params: {
      financial_year: financialYear || undefined,
      month: month || undefined,
      branch: branch || undefined,
    },
  });

export const createJournalEntry = (payload) =>
  api.post("/accounts/journal-entries", payload);

export const createGLAccount = (payload) =>
  api.post("/accounts/gl-accounts", payload);

export const createFixedAsset = (payload) =>
  api.post("/accounts/fixed-assets", payload);
