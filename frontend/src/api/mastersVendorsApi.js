import api from "./axiosConfig";

function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return { ...res, data: body.data };
  }
  return res;
}

/** Masters → Vendors (sidebar) */
export const listMastersVendors = async (search) =>
  unwrap(await api.get("/api/masters/vendors", { params: search ? { search } : undefined }));

export const getMastersVendor = async (id) =>
  unwrap(await api.get(`/api/masters/vendors/${id}`));

export const createMastersVendor = async (payload) =>
  unwrap(await api.post("/api/masters/vendors", payload));

export const updateMastersVendor = async (id, payload) =>
  unwrap(await api.put(`/api/masters/vendors/${id}`, payload));

export const deleteMastersVendor = async (id) =>
  unwrap(await api.delete(`/api/masters/vendors/${id}`));

export const bulkImportMastersVendors = async (rows) =>
  unwrap(await api.post("/api/masters/vendors/bulk-import", { rows }));
