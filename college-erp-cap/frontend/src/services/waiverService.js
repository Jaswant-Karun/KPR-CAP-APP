import { apiRequest } from "./api";

export const getWaiverRequests = (token, filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", String(filters.search));
  if (filters.acy && filters.acy !== "all") params.set("acy", String(filters.acy));
  if (filters.sem && filters.sem !== "all") params.set("sem", String(filters.sem));
  if (filters.type && filters.type !== "all") params.set("type", String(filters.type));
  if (filters.department && filters.department !== "all") params.set("department", String(filters.department));
  if (filters.batch && filters.batch !== "all") params.set("batch", String(filters.batch));
  if (filters.section && filters.section !== "all") params.set("section", String(filters.section));
  if (filters.active && filters.active !== "all") params.set("active", String(filters.active));

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/waivers${query}`, "GET", null, token);
};

export const updateWaiverRequestStatus = (waiverId, payload, token) =>
  apiRequest(`/services/waivers/${encodeURIComponent(waiverId)}/status`, "PATCH", payload, token);
