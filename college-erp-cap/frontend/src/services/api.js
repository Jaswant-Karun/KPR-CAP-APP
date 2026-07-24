// src/services/api.js
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? `${window.location.origin}/api` : "http://localhost:5004/api");

export const apiRequest = async (endpoint, method = "GET", data = null, token = null) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const fullUrl = `${BASE_URL}${endpoint}`;
    console.log("api.js - Making request:", { fullUrl, method, hasData: !!data });

    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    });

    console.log("api.js - Response status:", res.status, res.statusText);

    if (!res.ok) {
      const errorData = await res.json();
      console.error("api.js - Error response:", errorData);
      throw new Error(errorData.message || "API request failed");
    }

    const responseData = await res.json();
    console.log("api.js - Response data:", responseData);
    return responseData;
  } catch (err) {
    console.error("api.js - Catch block error:", err);
    throw err;
  }
};
