import api from "./axiosConfig";

export const listDispatchAddresses = (params = {}) =>
  api.get("/sales/dispatch-addresses", { params });

export const createDispatchAddress = (payload) =>
  api.post("/sales/dispatch-addresses", payload);

export const updateDispatchAddress = (id, payload) =>
  api.patch(`/sales/dispatch-addresses/${id}`, payload);

export const deleteDispatchAddress = (id) =>
  api.delete(`/sales/dispatch-addresses/${id}`);
