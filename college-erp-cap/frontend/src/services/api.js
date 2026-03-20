// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiRequest = async (endpoint, method = "GET", data = null, token = null) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "API request failed");
    }

    return await res.json();
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
};
