import { apiRequest } from "./api";

export const createAoBooking = (payload, token) =>
  apiRequest("/services/ao-bookings", "POST", payload, token);

export const getAoBookings = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/ao-bookings${query}`, "GET", null, token);
};

export const deleteAoBooking = (bookingId, token) =>
  apiRequest(`/services/ao-bookings/${bookingId}`, "DELETE", null, token);

export const updateAoBookingStatus = (bookingId, payload, token) =>
  apiRequest(`/services/ao-bookings/${bookingId}/status`, "PATCH", payload, token);

export const createFusionBooking = (payload, token) =>
  apiRequest("/services/fusion-bookings", "POST", payload, token);

export const getFusionBookings = (token) =>
  apiRequest("/services/fusion-bookings", "GET", null, token);

export const deleteFusionBooking = (bookingId, token) =>
  apiRequest(`/services/fusion-bookings/${bookingId}`, "DELETE", null, token);

export const updateFusionBookingStatus = (bookingId, payload, token) =>
  apiRequest(`/services/fusion-bookings/${bookingId}/status`, "PATCH", payload, token);
