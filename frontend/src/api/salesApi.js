import api from "./axiosConfig";

export const getCustomers = () => api.get("/sales/customers");
export const createCustomer = (payload) => api.post("/sales/customers", payload);

export const getSalesOrders = (_tenantId, status = null) =>
  api.get("/sales/sales-orders", { params: { status } });
export const getSalesOrdersEnriched = () => api.get("/sales/sales-orders/enriched");
export const getSOSummary = () => api.get("/sales/sales-orders/summary");
export const getSalesOrderDetail = (orderId) => api.get(`/sales/sales-orders/${orderId}`);
export const createSalesOrder = (payload) => api.post("/sales/sales-orders", payload);
export const updateSalesOrderStatus = (orderId, status) =>
  api.patch(`/sales/sales-orders/${orderId}/status`, null, { params: { status } });
export const confirmSalesOrder = (orderId) =>
  api.post(`/sales/sales-orders/${orderId}/confirm`);
export const updateSalesOrderDispatch = (orderId, flags) =>
  api.patch(`/sales/sales-orders/${orderId}/dispatch`, null, { params: flags });

export const getInvoices = (_tenantId, status = null) =>
  api.get("/sales/invoices", { params: { status } });
export const getInvoicesEnriched = () => api.get("/sales/invoices/enriched");
export const getInvoiceSummary = () => api.get("/sales/invoices/summary");
export const getInvoiceDetail = (invoiceId) => api.get(`/sales/invoices/${invoiceId}`);
export const createInvoice = (payload) => api.post("/sales/invoices", payload);

export const getPayments = (_tenantId, invoiceId = null) =>
  api.get("/sales/payments", { params: { invoice_id: invoiceId } });
export const createPayment = (payload) => api.post("/sales/payments", payload);

export const getLeads = (status = null) => api.get("/sales/leads", { params: { status } });
export const getLeadSummary = () => api.get("/sales/leads/summary");
export const getLeadsEnriched = () => api.get("/sales/leads/enriched");
export const createLead = (payload) => api.post("/sales/leads", payload);
export const updateLeadStatus = (leadId, status) =>
  api.patch(`/sales/leads/${leadId}/status`, null, { params: { status } });
export const getLeadActivities = (leadId) => api.get(`/sales/leads/${leadId}/activities`);
export const createLeadActivity = (leadId, payload) => api.post(`/sales/leads/${leadId}/activities`, payload);

export const getQuotations = (status = null) =>
  api.get("/sales/quotations", { params: { status } });
export const getQuotationSummary = () => api.get("/sales/quotations/summary");
export const getQuotationsEnriched = () => api.get("/sales/quotations/enriched");
export const createQuotation = (payload) => api.post("/sales/quotations", payload);
export const updateQuotationStatus = (quoteId, status) =>
  api.patch(`/sales/quotations/${quoteId}/status`, null, { params: { status } });
export const convertQuotationToSalesOrder = (quoteId, payload = {}) =>
  api.post(`/sales/quotations/${quoteId}/convert-to-so`, payload);

export const getSalesHub = () => api.get("/sales/hub");
