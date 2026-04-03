import { apiRequest } from "./api";

export const getNdcAchievements = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.department && filters.department !== "all") params.set("department", filters.department);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/ndc-achievements${query}`, "GET", null, token);
};

export const getNdcAchievementById = (achievementId, token) =>
  apiRequest(`/ndc-achievements/${achievementId}`, "GET", null, token);

export const createNdcAchievement = (payload, token) =>
  apiRequest(`/ndc-achievements`, "POST", payload, token);

export const updateNdcAchievementStatus = (achievementId, payload, token) =>
  apiRequest(`/ndc-achievements/${achievementId}/status`, "PATCH", payload, token);

export const deleteNdcAchievement = (achievementId, token) =>
  apiRequest(`/ndc-achievements/${achievementId}/delete`, "PATCH", {}, token);
