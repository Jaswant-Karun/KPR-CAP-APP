import { apiRequest } from "./api";

export const getFeedbackCycles = (token) => apiRequest("/feedback/cycles", "GET", null, token);

export const createFeedbackCycle = (payload, token) =>
  apiRequest("/feedback/cycles", "POST", payload, token);

export const activateFeedbackCycle = (cycleId, token) =>
  apiRequest(`/feedback/cycles/${cycleId}/activate`, "PATCH", {}, token);

export const getStudentFeedbackContext = (token) =>
  apiRequest("/feedback/student/context", "GET", null, token);

export const submitStudentFeedback = (payload, token) =>
  apiRequest("/feedback/student/submit", "POST", payload, token);

export const getStudentFeedbackReports = (token) =>
  apiRequest("/feedback/student/reports", "GET", null, token);

export const getFeedbackUsers = (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.cycleId) query.set("cycleId", String(params.cycleId));
  if (params.search) query.set("search", String(params.search));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest(`/feedback/users${suffix}`, "GET", null, token);
};

export const getFeedbackUserDetails = (submissionId, token) =>
  apiRequest(`/feedback/users/${submissionId}`, "GET", null, token);

export const getFacultyFeedbackPerformance = (token, cycleId) => {
  const suffix = cycleId ? `?cycleId=${encodeURIComponent(cycleId)}` : "";
  return apiRequest(`/feedback/faculty/performance${suffix}`, "GET", null, token);
};

export const submitFacultyFeedbackReason = (cycleId, reason, token) =>
  apiRequest(`/feedback/faculty/cycles/${cycleId}/reason`, "POST", { reason }, token);

export const submitAdminFeedbackAction = (cycleId, facultyId, action, token) =>
  apiRequest(`/feedback/admin/cycles/${cycleId}/faculty/${facultyId}/action`, "POST", { action }, token);
