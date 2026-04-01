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

export const getEvents = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.search) params.set("search", filters.search);
  if (filters.date) params.set("date", filters.date);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/events${query}`, "GET", null, token);
};

export const createEvent = (payload, token) =>
  apiRequest("/services/events", "POST", payload, token);

export const updateEvent = (eventId, payload, token) =>
  apiRequest(`/services/events/${eventId}`, "PATCH", payload, token);

export const deleteEvent = (eventId, token) =>
  apiRequest(`/services/events/${eventId}`, "DELETE", null, token);

export const registerEvent = (eventId, token) =>
  apiRequest(`/services/events/${eventId}/register`, "POST", null, token);

export const unregisterEvent = (eventId, token) =>
  apiRequest(`/services/events/${eventId}/register`, "DELETE", null, token);
