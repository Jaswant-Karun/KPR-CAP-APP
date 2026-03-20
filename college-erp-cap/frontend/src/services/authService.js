// src/services/authService.js
import { apiRequest } from "./api";

export const login = async (credentials) => {
  // MOCK LOGIN FOR DEVELOPMENT
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          token: "mock-jwt-token",
          user: {
            id: 1,
            name: "Test User",
            email: credentials.email,
            role: credentials.role || "student", // Use passed role or default to student
          },
        },
      });
    }, 1000);
  });
  // Original call: return apiRequest("/auth/login", "POST", credentials);
};
export const logout = (token) => apiRequest("/auth/logout", "POST", null, token);
export const forgotPassword = (email) => apiRequest("/auth/forgot-password", "POST", { email });
export const resetPassword = (token, password) =>
  apiRequest(`/auth/reset-password/${token}`, "POST", { password });
