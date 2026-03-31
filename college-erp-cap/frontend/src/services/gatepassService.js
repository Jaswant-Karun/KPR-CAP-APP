import { apiRequest } from "./api";

export const createGatepass = (payload, token) =>
  apiRequest("/services/gatepass", "POST", payload, token);

export const getGatepassRequests = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.studentId) params.set("studentId", String(filters.studentId));
  if (filters.type) params.set("type", String(filters.type));
  if (filters.passCategory) params.set("passCategory", String(filters.passCategory));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/gatepass${query}`, "GET", null, token);
};

export const updateGatepassStatus = (gatepassId, payload, token) =>
  apiRequest(`/services/gatepass/${gatepassId}/status`, "PATCH", payload, token);
