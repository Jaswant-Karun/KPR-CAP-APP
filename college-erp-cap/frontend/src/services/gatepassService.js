import { apiRequest } from "./api";

export const createGatepass = (payload, token) =>
  apiRequest("/services/gatepass", "POST", payload, token);

export const getGatepassRequests = (token, status) =>
  apiRequest(`/services/gatepass${status ? `?status=${encodeURIComponent(status)}` : ""}`, "GET", null, token);

export const updateGatepassStatus = (gatepassId, payload, token) =>
  apiRequest(`/services/gatepass/${gatepassId}/status`, "PATCH", payload, token);
