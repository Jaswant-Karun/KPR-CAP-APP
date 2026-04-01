import { apiRequest } from "./api";

export const createLatecomerRequest = (payload, token) =>
  apiRequest("/services/latecomers", "POST", payload, token);

export const getLatecomerRequests = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", String(filters.status));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/latecomers${query}`, "GET", null, token);
};

export const updateLatecomerStatus = (requestId, payload, token) =>
  apiRequest(`/services/latecomers/${requestId}/status`, "PATCH", payload, token);
