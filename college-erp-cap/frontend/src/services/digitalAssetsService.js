import { apiRequest } from "./api";

export const getDigitalAssets = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.group) params.set("group", String(filters.group));
  if (filters.status) params.set("status", String(filters.status));
  if (filters.search) params.set("search", String(filters.search));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/digital-assets${query}`, "GET", null, token);
};

export const createDigitalAsset = (payload, token) =>
  apiRequest("/digital-assets", "POST", payload, token);

export const deleteDigitalAsset = (assetId, token) =>
  apiRequest(`/digital-assets/${assetId}`, "DELETE", null, token);
