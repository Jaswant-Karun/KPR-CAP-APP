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

export const createServiceRequest = (payload, token) =>
  apiRequest("/services/requests", "POST", payload, token);

export const getServiceRequests = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/requests${query}`, "GET", null, token);
};

export const updateServiceRequestStatus = (requestId, payload, token) =>
  apiRequest(`/services/requests/${requestId}/status`, "PATCH", payload, token);

export const grantIboxRequisitionPermission = (requestId, token) =>
  apiRequest(`/services/requests/${requestId}/ibox-permission`, "PATCH", null, token);

export const convertIboxRequisitionToComplaint = (requestId, token) =>
  apiRequest(`/services/requests/${requestId}/ibox-convert`, "POST", null, token);

export const acceptIdCardReissueRequest = (requestId, payload, token) =>
  apiRequest(`/services/requests/${requestId}/id-card-accept`, "PATCH", payload, token);

export const escalateIdCardReissueRequest = (requestId, payload, token) =>
  apiRequest(`/services/requests/${requestId}/id-card-escalate`, "PATCH", payload, token);

export const deleteServiceRequest = (requestId, token) =>
  apiRequest(`/services/requests/${requestId}`, "DELETE", null, token);

export const createBonafideRequest = (payload, token) =>
  apiRequest("/services/requests", "POST", {
    title: payload.title,
    category: "bonafide",
    description: payload.description,
    metadata: payload.metadata || {},
  }, token);

export const getBonafideRequests = (token, filters = {}) => {
  const params = new URLSearchParams();
  params.set("category", "bonafide");
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/requests${query}`, "GET", null, token);
};

export const updateBonafideStatus = (requestId, payload, token) =>
  apiRequest(`/services/requests/${requestId}/status`, "PATCH", payload, token);

export const createHostelApplicationRequest = (payload, token) =>
  apiRequest("/services/requests", "POST", {
    title: payload.title,
    category: "hostel-app",
    description: payload.description,
    metadata: payload.metadata || {},
  }, token);

export const getHostelApplicationRequests = (token, filters = {}) => {
  const params = new URLSearchParams();
  params.set("category", "hostel-app");
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/requests${query}`, "GET", null, token);
};

export const updateHostelApplicationStatus = (requestId, payload, token) =>
  apiRequest(`/services/requests/${requestId}/status`, "PATCH", payload, token);

export const createHostelPermissionRequest = (payload, token) =>
  apiRequest("/services/requests", "POST", {
    title: payload.title,
    category: "hostel-permission",
    description: payload.description,
    metadata: payload.metadata || {},
  }, token);

export const getHostelPermissionRequests = (token, filters = {}) => {
  const params = new URLSearchParams();
  params.set("category", "hostel-permission");
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/requests${query}`, "GET", null, token);
};

export const updateHostelPermissionStatus = (requestId, payload, token) =>
  apiRequest(`/services/requests/${requestId}/status`, "PATCH", payload, token);

export const getHostelAttendanceRequests = (token, filters = {}) => {
  const params = new URLSearchParams();
  params.set("category", "hostel-attendance");
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.date) params.set("date", filters.date);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/services/requests${query}`, "GET", null, token);
};
