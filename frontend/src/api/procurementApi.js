import api from "./axiosConfig";

export const getPurchaseOrders = () => api.get("/procurement/purchase-orders");
export const getPurchaseOrdersEnriched = () => api.get("/procurement/purchase-orders/enriched");
export const getPOSummary = () => api.get("/procurement/purchase-orders/summary");
export const createPurchaseOrder = (payload) => api.post("/procurement/purchase-orders", payload);
export const updatePurchaseOrderStatus = (poId, status) =>
  api.patch(`/procurement/purchase-orders/${poId}/status`, null, { params: { status } });

export const getVendors = (params = {}) =>
  api.get("/procurement/vendors", { params });
export const getVendorSummary = () => api.get("/procurement/vendors/summary");
export const getVendorDetail = (vendorId) => api.get(`/procurement/vendors/${vendorId}`);
export const getVendorPurchaseHistory = (vendorId) =>
  api.get(`/procurement/vendors/${vendorId}/purchase-history`);
export const getVendorProducts = (vendorId) =>
  api.get(`/procurement/vendors/${vendorId}/products`);
export const exportVendors = (params = {}) =>
  api.get("/procurement/vendors/export", { params });
export const lookupVendorBank = (ifsc, accountNumber) =>
  api.get("/procurement/vendors/bank-lookup", {
    params: { ifsc, account_number: accountNumber },
  });
export const createVendor = (payload) => api.post("/procurement/vendors", payload);
export const updateVendor = (vendorId, payload) =>
  api.put(`/procurement/vendors/${vendorId}`, payload);
export const deleteVendor = (vendorId) => api.delete(`/procurement/vendors/${vendorId}`);
export const bulkVendorStatus = (payload) =>
  api.post("/procurement/vendors/bulk-status", payload);
export const deactivateVendor = (vendorId) =>
  api.patch(`/procurement/vendors/${vendorId}/deactivate`);
export const updateVendorApproval = (vendorId, status) =>
  api.patch(`/procurement/vendors/${vendorId}/approval`, null, { params: { status } });

export const getMaterialRequests = () => api.get("/procurement/material-requests");
export const getMaterialRequest = (mrId) => api.get(`/procurement/material-requests/${mrId}`);
export const getMRSummary = () => api.get("/procurement/material-requests/summary");
export const getMREnriched = () => api.get("/procurement/material-requests/enriched");
export const createMaterialRequest = (payload) => api.post("/procurement/material-requests", payload);
export const convertMaterialRequestToPO = (mrId, payload) =>
  api.post(`/procurement/material-requests/${mrId}/convert-to-po`, payload);
export const approveMaterialRequest = (mrId, { approved = true, notes } = {}) =>
  api.post(`/procurement/material-requests/${mrId}/approve`, null, {
    params: { approved, notes },
  });


export const getRFQSummary = () => api.get("/procurement/rfq/summary");
export const getRFQList = () => api.get("/procurement/rfq");
export const getRFQComparison = (rfqId) => api.get(`/procurement/rfq/${rfqId}/comparison`);
export const createRFQ = (payload) => api.post("/procurement/rfq", payload);
export const addVendorQuotation = (rfqId, payload) => api.post(`/procurement/rfq/${rfqId}/quotation`, payload);
export const awardRFQ = (rfqId, payload) => api.patch(`/procurement/rfq/${rfqId}/award`, payload);


export const getGoodsReceipts = () => api.get("/procurement/goods-receipt");
export const getGRNSummary = () => api.get("/procurement/goods-receipt/summary");
export const getGRNEnriched = () => api.get("/procurement/goods-receipt/enriched");
export const createGoodsReceipt = (payload) => api.post("/procurement/goods-receipt", payload);
export const approveGoodsReceiptQC = (grnId, payload) =>
  api.post(`/procurement/goods-receipt/${grnId}/qc`, payload);

export const getVendorBills = () => api.get("/procurement/vendor-bills");
export const getVendorBillSummary = () => api.get("/procurement/vendor-bills/summary");
export const createVendorBill = (payload) => api.post("/procurement/vendor-bills", payload);
export const updateVendorBillStatus = (billId, status) =>
  api.patch(`/procurement/vendor-bills/${billId}/status`, { status });


export const updateVendorBill = (billId, payload) => api.put(`/procurement/vendor-bills/${billId}`, payload);

export const getSupplierPayments = () => api.get("/procurement/supplier-payments");
export const createSupplierPayment = (payload) => api.post("/procurement/supplier-payments", payload);

export const getProcurementHub = () => api.get("/procurement/hub");
