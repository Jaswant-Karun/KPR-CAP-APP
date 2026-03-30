import { apiRequest } from "./api";

export const getDepartments = (token) => apiRequest("/departments", "GET", null, token);

export const createDepartment = (data, token) => apiRequest("/departments", "POST", data, token);

export const updateDepartment = (departmentId, data, token) =>
  apiRequest(`/departments/${departmentId}`, "PATCH", data, token);

export const deleteDepartment = (departmentId, token) =>
  apiRequest(`/departments/${departmentId}`, "DELETE", null, token);
