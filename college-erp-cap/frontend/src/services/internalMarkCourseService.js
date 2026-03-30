import { apiRequest } from "./api";

export const getInternalMarkCourses = (token, department) => {
  const query = department ? `?department=${encodeURIComponent(department)}` : "";
  return apiRequest(`/internal-mark-courses${query}`, "GET", null, token);
};

export const createInternalMarkCourse = (payload, token) =>
  apiRequest("/internal-mark-courses", "POST", payload, token);

export const updateInternalMarkCourse = (courseId, payload, token) =>
  apiRequest(`/internal-mark-courses/${courseId}`, "PATCH", payload, token);

export const deleteInternalMarkCourse = (courseId, token) =>
  apiRequest(`/internal-mark-courses/${courseId}`, "DELETE", null, token);
