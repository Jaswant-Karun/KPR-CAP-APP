// src/services/authService.js
import { apiRequest } from "./api";

export const login = async (credentials) => {
  return apiRequest("/auth/login", "POST", credentials);
};
export const signup = async (payload) => apiRequest("/auth/signup", "POST", payload);
export const logout = (token) => apiRequest("/auth/logout", "POST", null, token);
export const forgotPassword = (email) => apiRequest("/auth/forgot-password", "POST", { email });
export const resetPassword = (token, password) =>
  apiRequest(`/auth/reset-password/${token}`, "POST", { password });
