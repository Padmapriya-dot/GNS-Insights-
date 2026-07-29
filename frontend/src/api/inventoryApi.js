import api from "./axiosConfig";

export const getWarehouses = () => api.get("/inventory/warehouses");
export const getWarehouseSummary = () => api.get("/inventory/warehouses/summary");
export const getWarehouseDetail = (warehouseId) => api.get(`/inventory/warehouses/${warehouseId}`);
export const createWarehouseFull = (payload) => api.post("/inventory/warehouses/full", payload);
export const updateWarehouse = (warehouseId, payload) => api.put(`/inventory/warehouses/${warehouseId}`, payload);
export const deactivateWarehouse = (warehouseId) => api.patch(`/inventory/warehouses/${warehouseId}/deactivate`);
export const createWarehouse = (payload) => api.post("/inventory/warehouses", payload);
export const getSuppliers = () => api.get("/inventory/suppliers");
export const createSupplier = (payload) => api.post("/inventory/suppliers", payload);
export const getInventoryItems = (_tenantId, lowStockOnly = false) =>
  api.get("/inventory/items", { params: { low_stock_only: lowStockOnly } });
export const createInventoryItem = (payload) => api.post("/inventory/items", payload);
export const getItemByBarcode = (_tenantId, barcode) =>
  api.get(`/inventory/items/barcode/${encodeURIComponent(barcode)}`);
export const getInventoryDashboard = (itemType) =>
  api.get("/inventory/dashboard", { params: itemType ? { item_type: itemType } : undefined });
export const getStockByWarehouse = (warehouseId) => api.get(`/inventory/stock-levels/warehouse/${warehouseId}`);
export const getStockByItem = (itemId) => api.get(`/inventory/stock-levels/item/${itemId}`);
export const updateStock = (warehouseId, itemId, quantity) =>
  api.put("/inventory/stock-levels", null, { params: { warehouse_id: warehouseId, item_id: itemId, quantity } });
export const getStockMovements = (_tenantId, itemId) =>
  api.get("/inventory/stock-movements", { params: { item_id: itemId } });
export const recordStockMovement = (payload) => api.post("/inventory/stock-movements", payload);

export const getRawMaterialsSummary = () => api.get("/inventory/raw-materials/summary");
export const getRawMaterials = () => api.get("/inventory/raw-materials");
export const getRawMaterialDetail = (itemId) => api.get(`/inventory/raw-materials/${itemId}`);
export const getFinishedGoodsSummary = () => api.get("/inventory/finished-goods/summary");
export const getFinishedGoods = () => api.get("/inventory/finished-goods");
export const getStockTransfers = () => api.get("/inventory/transfers");
export const createStockTransfer = (payload) => api.post("/inventory/transfers", payload);
export const updateStockTransferStatus = (transferId, payload) =>
  api.patch(`/inventory/transfers/${transferId}/status`, payload);

export const getStockAdjustments = () => api.get("/inventory/adjustments");
export const createStockAdjustment = (payload) => api.post("/inventory/adjustments", payload);
export const updateStockAdjustmentStatus = (adjustmentId, payload) =>
  api.patch(`/inventory/adjustments/${adjustmentId}/status`, payload);

export const getLedgerSummary = () => api.get("/inventory/ledger/summary");
export const getStockLedger = () => api.get("/inventory/ledger");
export const getInventoryHub = () => api.get("/inventory/hub");
