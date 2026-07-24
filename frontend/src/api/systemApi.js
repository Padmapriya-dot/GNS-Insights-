import api from "./axiosConfig";

function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return { ...res, data: body.data, message: body.message };
  }
  return res;
}

export async function clearTenantData() {
  return unwrap(await api.post("/api/system/clear-tenant-data"));
}

export async function seedTenantData() {
  return unwrap(await api.post("/api/system/seed-tenant-data"));
}
