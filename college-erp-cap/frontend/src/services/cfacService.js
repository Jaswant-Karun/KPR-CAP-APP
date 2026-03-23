import { apiRequest } from "./api";

export const getCfacStudents = (token) => apiRequest("/cfac/students", "GET", null, token);

export const getCfacRegistrations = (token, studentId) => {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
  return apiRequest(`/cfac/registrations${query}`, "GET", null, token);
};

export const getCfacHistory = (registrationId, token) =>
  apiRequest(`/cfac/registrations/${registrationId}/history`, "GET", null, token);

export const getCfacInternals = (registrationId, token) =>
  apiRequest(`/cfac/registrations/${registrationId}/internals`, "GET", null, token);

export const getCfacDownloadPayload = (registrationId, token) =>
  apiRequest(`/cfac/registrations/${registrationId}/download`, "GET", null, token);

export const createCfacRegistration = (payload, token) =>
  apiRequest("/cfac/registrations", "POST", payload, token);

export const updateCfacRegistration = (registrationId, payload, token) =>
  apiRequest(`/cfac/registrations/${registrationId}`, "PATCH", payload, token);
