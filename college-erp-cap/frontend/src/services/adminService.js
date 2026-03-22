import { apiRequest } from "./api";

export const getAdminDashboard = (token) => apiRequest("/admin/dashboard", "GET", null, token);

export const getStudents = (token) => apiRequest("/admin/students", "GET", null, token);
export const updateStudent = (studentId, payload, token) =>
  apiRequest(`/admin/students/${studentId}`, "PUT", payload, token);
export const removeStudent = (studentId, token) =>
  apiRequest(`/admin/students/${studentId}`, "DELETE", null, token);

export const getFaculty = (token) => apiRequest("/admin/faculty", "GET", null, token);
export const updateFaculty = (facultyId, payload, token) =>
  apiRequest(`/admin/faculty/${facultyId}`, "PUT", payload, token);
export const removeFaculty = (facultyId, token) =>
  apiRequest(`/admin/faculty/${facultyId}`, "DELETE", null, token);
